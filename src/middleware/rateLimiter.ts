import { Request, Response, NextFunction } from "express-serve-static-core";

interface RequestLog {
  count: number;
  lastRequest: number;
}

const requests = new Map<string, RequestLog>();
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS = 5; // 5 requests per day

export const phoneAuthLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  // Clean up old entries
  if (requests.has(ip)) {
    const log = requests.get(ip)!;
    if (now - log.lastRequest > WINDOW_MS) {
      requests.delete(ip);
    }
  }

  // Get or create request log
  const log = requests.get(ip) || { count: 0, lastRequest: now };

  // Check if IP has exceeded limit
  if (log.count >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: `Maximum ${MAX_REQUESTS} requests allowed per IP address per 24 hours`,
    });
    return;
  }

  // Update request log
  requests.set(ip, {
    count: log.count + 1,
    lastRequest: now,
  });

  next();
};

const exampleMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Accessing deviceInfo safely
  const deviceInfo = req.deviceInfo || { userAgent: "unknown", ip: "unknown" };
  console.log(deviceInfo);
  next();
};
