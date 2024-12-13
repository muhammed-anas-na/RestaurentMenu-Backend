// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  initiatePhoneAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({
          success: false,
          message: "Request body is required",
        });
        return;
      }
      const result = await this.authService.initiatePhoneAuth(
        req.body,
        req.deviceInfo
      );

      if (!result.success) {
        console.log("Service returned error:", result); 
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Phone auth controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };

  verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.verifyOTP(req.body);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
}
