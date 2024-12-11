// src/services/auth.service.ts
import {
  AuthResponse,
  PhoneAuthRequest,
  VerifyOTPRequest,
} from "../types/auth.types";
import { BlockingService } from "./blocking.service";
import { User } from "../models/user.model";
import jwt from "jsonwebtoken";
import { DeviceInfo } from "security.types";
import { RequestLog, FailedAttempt } from "../models/security.model";

interface OTPData {
  otp: string;
  timestamp: number;
  attempts: number;
}

export class AuthService {
  private static instance: AuthService;
  private blockingService: BlockingService;
  // Using Map as temporary storage (in production, Firebase handles this)
  private tempOTPStore: Map<string, OTPData> = new Map();

  private constructor() {
    this.blockingService = BlockingService.getInstance();
    // Clear expired OTPs every 5 minutes
    setInterval(() => this.clearExpiredOTPs(), 5 * 60 * 1000);
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private clearExpiredOTPs(): void {
    const now = Date.now();
    for (const [phoneNumber, data] of this.tempOTPStore.entries()) {
      if (data.timestamp < now) {
        this.tempOTPStore.delete(phoneNumber);
      }
    }
  }

  async initiatePhoneAuth(
    data: PhoneAuthRequest,
    deviceInfo: DeviceInfo
  ): Promise<AuthResponse> {
    try {
      const { phoneNumber } = data;

      const isSuspicious = await this.checkSuspiciousActivity(
        phoneNumber,
        deviceInfo
      );
      if (isSuspicious) {
        await this.logFailedAttempt(
          deviceInfo.ip,
          "IP",
          "Suspicious activity detected"
        );
        return {
          success: false,
          message: "Request blocked due to suspicious activity",
        };
      }

      // Check if blocked
      const blockCheck = await this.blockingService.checkBlocked(phoneNumber);
      if (!blockCheck.success) {
        return blockCheck;
      }

      // Check if OTP already exists and is not expired
      const existingOTP = this.tempOTPStore.get(phoneNumber);
      if (existingOTP && existingOTP.timestamp > Date.now()) {
        const remainingTime = Math.ceil(
          (existingOTP.timestamp - Date.now()) / 1000
        );
        return {
          success: false,
          message: `Please wait ${remainingTime} seconds before requesting new OTP`,
        };
      }

      // Generate new 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP with 5-minute expiration
      this.tempOTPStore.set(phoneNumber, {
        otp,
        timestamp: Date.now() + 5 * 60 * 1000, // 5 minutes
        attempts: 0,
      });

      // Record attempt for blocking system
      await this.blockingService.recordAttempt(phoneNumber);

      // In development, log OTP (in production, Firebase sends SMS)
      console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);

      return {
        success: true,
        message: "OTP sent successfully",
        data: {
          verificationId: phoneNumber, // In production, Firebase provides this
          expiresIn: 300, // 5 minutes in seconds
        },
      };
    } catch (error: any) {
      console.error("Phone auth initiation failed:", error);
      return {
        success: false,
        message: "Failed to initiate phone authentication",
        error: error.message,
      };
    }
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<AuthResponse> {
    try {
      const { phoneNumber, otpCode } = data;

      // Check if blocked
      const blockCheck = await this.blockingService.checkBlocked(phoneNumber);
      if (!blockCheck.success) {
        return blockCheck;
      }

      // Get stored OTP data
      const storedData = this.tempOTPStore.get(phoneNumber);

      // Check if OTP exists
      if (!storedData) {
        return {
          success: false,
          message: "OTP expired or not found. Please request new OTP.",
        };
      }

      // Check if OTP is expired
      if (Date.now() > storedData.timestamp) {
        this.tempOTPStore.delete(phoneNumber);
        return {
          success: false,
          message: "OTP expired. Please request new OTP.",
        };
      }

      // Increment attempts
      storedData.attempts += 1;

      // Check max attempts for this specific OTP
      if (storedData.attempts > 3) {
        this.tempOTPStore.delete(phoneNumber);
        await this.blockingService.recordAttempt(phoneNumber);
        return {
          success: false,
          message: "Too many invalid attempts. Please request new OTP.",
        };
      }

      // Verify OTP
      if (storedData.otp !== otpCode) {
        await this.blockingService.recordAttempt(phoneNumber);
        return {
          success: false,
          message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`,
        };
      }

      // OTP verified - clear it
      this.tempOTPStore.delete(phoneNumber);

      // Create or update user
      let user = await User.findOne({ phoneNumber });
      if (!user) {
        user = await User.create({
          phoneNumber,
          isVerified: true,
        });
      } else {
        user.isVerified = true;
        user.lastLogin = new Date();
        await user.save();
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, phoneNumber },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      return {
        success: true,
        message: "Authentication successful",
        data: { token, user },
      };
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      return {
        success: false,
        message: "Failed to verify OTP",
        error: error.message,
      };
    }
  }

  private async logFailedAttempt(
    identifier: string,
    type: "IP" | "PHONE",
    reason: string
  ): Promise<void> {
    try {
      await FailedAttempt.findOneAndUpdate(
        { identifier, type },
        {
          $inc: { attempts: 1 },
          $set: { lastAttempt: new Date() },
          $push: { details: `${new Date().toISOString()}: ${reason}` },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("Error logging failed attempt:", error);
    }
  }

  private async checkSuspiciousActivity(
    phoneNumber: string,
    deviceInfo: DeviceInfo
  ): Promise<boolean> {
    try {
      // Check for multiple devices
      const recentRequests = await RequestLog.find({
        "deviceInfo.phoneNumber": phoneNumber,
        lastRequest: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }).lean(); // Use lean() to get plain JavaScript objects

      const uniqueDevices = new Set(
        recentRequests
          .filter(
            (request) => request.deviceInfo && request.deviceInfo.userAgent
          )
          .map((request) => request.deviceInfo.userAgent)
      );

      if (uniqueDevices.size > 5) {
        await this.logFailedAttempt(
          phoneNumber,
          "PHONE",
          "Multiple device attempts"
        );
        return true;
      }
      // Check for geographical anomalies (if you have IP geolocation)
      // Check for unusual timing patterns
      // Check for known malicious IPs
      return false;
    } catch (error) {
      console.error("Error checking suspicious activity:", error);
      return false;
    }
  }
}
