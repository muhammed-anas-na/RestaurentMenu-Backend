// src/routes/auth.routes.ts
import express from "express";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { AuthController } from "../controllers/auth.controller";
import { phoneAuthLimiter } from "../middleware/rateLimiter";
import {
  validatePhoneAuth,
  validateOTPVerification,
} from "../middleware/validation";
import { asyncHandler } from "../middleware/asyncHandler";
import { phoneNumberSanitizer } from "../middleware/security.middleware";

const router = express.Router();
const authController = new AuthController();

// Add proper middleware typing
router.use((req: Request, res: Response, next: NextFunction) =>
  phoneNumberSanitizer(req, res, next)
);

router.post(
  "/phone/initiate",
  phoneAuthLimiter,
  validatePhoneAuth,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await authController.initiatePhoneAuth(req, res);
  })
);

router.post(
  "/phone/verify",
  validateOTPVerification,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await authController.verifyOTP(req, res);
  })
);

export default router;
