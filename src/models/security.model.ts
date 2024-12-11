// src/models/security.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IRequestLog extends Document {
  ip: string;
  endpoint: string;
  count: number;
  firstRequest: Date;
  lastRequest: Date;
  deviceInfo: {
    userAgent: string;
    phoneNumber?: string;
  };
}

const RequestLogSchema = new Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
  firstRequest: {
    type: Date,
    default: Date.now,
  },
  lastRequest: {
    type: Date,
    default: Date.now,
  },
  deviceInfo: {
    userAgent: { type: String, required: true },
    phoneNumber: String,
  },
});

// Compound index for IP and endpoint
RequestLogSchema.index({ ip: 1, endpoint: 1 });

export const RequestLog = mongoose.model<IRequestLog>(
  "RequestLog",
  RequestLogSchema
);

// Failed attempts tracking
export interface IFailedAttempt extends Document {
  identifier: string; // Can be IP or phone number
  type: "IP" | "PHONE";
  attempts: number;
  lastAttempt: Date;
  details: string[]; // Store failure reasons
}

const FailedAttemptSchema = new Schema({
  identifier: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["IP", "PHONE"],
    required: true,
  },
  attempts: {
    type: Number,
    default: 1,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  details: [
    {
      type: String,
    },
  ],
});

export const FailedAttempt = mongoose.model<IFailedAttempt>(
  "FailedAttempt",
  FailedAttemptSchema
);
