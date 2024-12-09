import express, { ErrorRequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import config from "./config/env";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.server.env !== "test") {
  app.use(morgan("combined"));
}

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).send("dont worry , connected successfully 😊");
});

// Error handling
app.use(errorHandler as ErrorRequestHandler);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

export default app;
