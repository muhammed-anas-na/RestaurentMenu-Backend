// src/models/blocked.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IBlockedEntity extends Document {
  phoneNumber: string;
  attempts: number;
  isAdminBlocked: boolean;  // true if blocked by exceeding daily limit
  blockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BlockedEntitySchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  isAdminBlocked: {
    type: Boolean,
    default: false
  },
  blockedUntil: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
BlockedEntitySchema.pre('save', function(next :any) {
  this.updatedAt = new Date();
  next();
});

export const BlockedEntity = mongoose.model<IBlockedEntity>('BlockedEntity', BlockedEntitySchema);