// src/middleware/security.middleware.ts
import { Request, Response } from 'express-serve-static-core';
import { RequestLog, FailedAttempt } from "../models/security.model";
import { NextFunction } from 'express-serve-static-core';
import { DeviceInfo } from '../types/security.types';



export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
};

export const requestLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || "unknown";
    const endpoint = req.path;

    await RequestLog.findOneAndUpdate(
      { ip, endpoint },
      {
        $inc: { count: 1 },
        $set: { lastRequest: new Date() },
        $setOnInsert: { firstRequest: new Date() },
      },
      { upsert: true }
    );

    next();
  } catch (error) {
    console.error("Request logging error:", error);
    next();
  }
};

export const phoneNumberSanitizer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body.phoneNumber) {
    req.body.phoneNumber = req.body.phoneNumber.replace(/[^\d+]/g, "");
    if (!req.body.phoneNumber.match(/^\+\d{10,15}$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
      return;
    }
  }
  next();
};
export const deviceFingerprint = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const deviceInfo: DeviceInfo = {
    userAgent: req.headers["user-agent"] || "unknown",
    ip: req.ip || "unknown",
    timestamp: Date.now(),
  };

  req.deviceInfo = deviceInfo;
  next();
};

export const advancedRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const WINDOW_SIZE = 15 * 60 * 1000;
  const MAX_REQUESTS = 100;

  const checkRateLimit = async () => {
    try {
      const ip = req.ip || "unknown";
      const now = new Date();
      const windowStart = new Date(now.getTime() - WINDOW_SIZE);

      const requestCount = await RequestLog.countDocuments({
        ip,
        lastRequest: { $gte: windowStart },
      });

      if (requestCount > MAX_REQUESTS) {
        res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });
      } else {
        next();
      }
    } catch (error) {
      console.error("Rate limiting error:", error);
      next();
    }
  };

  checkRateLimit();
};
