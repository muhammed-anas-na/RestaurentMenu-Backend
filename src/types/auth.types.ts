// src/types/auth.types.ts
export interface PhoneAuthRequest {
  phoneNumber: string;
  name: string;
  numberOfMembers: number;
  recaptchaToken: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otpCode: string;
  verificationId: string;
  name: string;         
  numberOfMembers: number; 
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token?: string;
    verificationId?: string;
    user?: any;
    sessionCookie?: string;
    isAdminBlocked?: boolean;
    blockedUntil?: Date;
    remainingTime?: string;
    expiresIn?: number;
  };
  error?: any;
}