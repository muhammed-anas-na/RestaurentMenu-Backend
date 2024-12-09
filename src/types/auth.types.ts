export interface PhoneAuthRequest {
    phoneNumber: string;
    recaptchaToken: string;
  }
  
  export interface VerifyOTPRequest {
    phoneNumber: string;
    otpCode: string;
    verificationId: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
      token?: string;
      verificationId?: string;
      user?: any;
    };
    error?: any;
  }