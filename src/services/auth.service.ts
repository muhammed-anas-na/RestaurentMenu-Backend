import jwt from 'jsonwebtoken';
import { PhoneAuthRequest, VerifyOTPRequest, AuthResponse } from '../types/auth.types';

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initiatePhoneAuth(data: PhoneAuthRequest): Promise<AuthResponse> {
    try {
      const { phoneNumber } = data;

      // Generate verification code
      const verificationId = this.generateVerificationCode();

      // Mock SMS sending for development
      console.log(`[DEV] SMS to ${phoneNumber}: Your verification code is: ${verificationId}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        data: { verificationId },
      };
    } catch (error: any) {
      console.error('Phone auth initiation failed:', error);
      return {
        success: false,
        message: 'Failed to initiate phone authentication',
        error: error.message,
      };
    }
  }

  private generateVerificationCode(): string {
    return Math.random().toString().substring(2, 8); // 6-digit code
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<AuthResponse> {
    try {
      const { phoneNumber, otpCode, verificationId } = data;

      // In production, use Firebase's verifyPhoneNumber
      // This is a simplified version
      const isValid = await this.validateOTP(phoneNumber, otpCode, verificationId);

      if (!isValid) {
        return {
          success: false,
          message: 'Invalid OTP',
        };
      }

      // Generate JWT token
      const token = this.generateToken(phoneNumber);

      // Create or update user in your database
      const user = await this.createOrUpdateUser(phoneNumber);

      return {
        success: true,
        message: 'Authentication successful',
        data: { token, user },
      };
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      return {
        success: false,
        message: 'Failed to verify OTP',
        error: error.message,
      };
    }
  }

  private async validateOTP(
    phoneNumber: string,
    otpCode: string,
    verificationId: string
  ): Promise<boolean> {
    // Implement OTP validation logic
    // In production, use Firebase's auth().verifyPhoneNumber()
    return true;
  }

  private generateToken(phoneNumber: string): string {
    return jwt.sign(
      { phoneNumber },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  private async createOrUpdateUser(phoneNumber: string): Promise<any> {
    // Implement user creation/update logic in your database
    return { phoneNumber };
  }
}