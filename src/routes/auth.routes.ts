// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { phoneAuthLimiter } from "../middleware/rateLimiter";
import {
  validatePhoneAuth,
  validateOTPVerification,
} from "../middleware/validation";
import { asyncHandler } from "../middleware/asyncHandler";
import { phoneNumberSanitizer } from "../middleware/security.middleware";

const router = Router();
const authController = new AuthController();

// Add proper middleware typing
router.use((req, res, next) => phoneNumberSanitizer(req, res, next));

router.post(
  "/phone/initiate",
  phoneAuthLimiter,
  validatePhoneAuth,
  asyncHandler(async (req, res, next) => {
    await authController.initiatePhoneAuth(req, res);
  })
);

router.post(
  "/phone/verify",
  validateOTPVerification,
  asyncHandler(async (req, res, next) => {
    await authController.verifyOTP(req, res);
  })
);

export default router;