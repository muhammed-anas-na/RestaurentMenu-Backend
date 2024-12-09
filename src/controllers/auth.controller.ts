import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { PhoneAuthRequest, VerifyOTPRequest } from '../types/auth.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  initiatePhoneAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: PhoneAuthRequest = req.body;
      const result = await this.authService.initiatePhoneAuth(data);
      
      if (!result.success) {
        res.status(400).json(result);
        return;
      }
      
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Phone auth controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };

  verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: VerifyOTPRequest = req.body;
      const result = await this.authService.verifyOTP(data);
      
      if (!result.success) {
        res.status(400).json(result);
        return;
      }
      
      res.status(200).json(result);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };
}