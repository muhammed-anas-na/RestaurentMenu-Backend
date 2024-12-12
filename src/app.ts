// src/app.ts
import express from "express";
import {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express-serve-static-core";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import config from "./config/env";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/errorHandler";
import {
  advancedRateLimiter,
  deviceFingerprint,
  requestLogger,
  securityHeaders,
} from "./middleware/security.middleware";

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(securityHeaders);
app.use(deviceFingerprint);
app.use(requestLogger);
app.use(advancedRateLimiter);

// Logging
if (config.server.env !== "test") {
  app.use(morgan("combined"));
}

// Routes
app.use("/api/auth", authRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("API is running 😊");
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

// Error handling
app.use(errorHandler as ErrorRequestHandler);

export default app;
