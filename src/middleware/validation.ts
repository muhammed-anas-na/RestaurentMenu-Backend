import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const phoneAuthSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be in E.164 format (e.g., +14155552671)",
      "any.required": "Phone number is required",
    }),
  recaptchaToken:
    process.env.NODE_ENV === "production"
      ? Joi.string().required().messages({
          "any.required": "reCAPTCHA token is required",
        })
      : Joi.string().optional(),
});

const otpVerificationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),
  otpCode: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP must be 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
    }),
  verificationId: Joi.string().required(),
});

export const validatePhoneAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = phoneAuthSchema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      error: error.details.map((detail) => detail.message),
    });
    return;
  }
  next();
};

export const validateOTPVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { error } = otpVerificationSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.details.map((detail) => detail.message),
      });
      return;
    }
    next();
  } catch (error: any) {
    next(error);
  }
};
