// src/services/blocking.service.ts
import { AuthResponse } from '../types/auth.types';
import { BlockedEntity, IBlockedEntity } from '../models/blocked.model';

export class BlockingService {
  private static instance: BlockingService;
  private readonly MAX_DAILY_ATTEMPTS = 7;  // More than 7 requests per day = admin block
  private readonly DAILY_BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  static getInstance(): BlockingService {
    if (!BlockingService.instance) {
      BlockingService.instance = new BlockingService();
    }
    return BlockingService.instance;
  }

  async checkBlocked(phoneNumber: string): Promise<AuthResponse> {
    try {
      const entity = await BlockedEntity.findOne({ phoneNumber });

      if (!entity) {
        return { success: true, message: 'Not blocked' };
      }

      // Check if admin blocked
      if (entity.isAdminBlocked) {
        return {
          success: false,
          message: 'Account is blocked due to excessive daily attempts. Contact admin for unblock.',
          data: { isAdminBlocked: true }
        };
      }

      // Check if temporarily blocked
      if (entity.blockedUntil && entity.blockedUntil > new Date()) {
        return {
          success: false,
          message: 'Account is temporarily blocked. Try again after 24 hours.',
          data: {
            blockedUntil: entity.blockedUntil,
            remainingTime: this.getRemainingTime(entity.blockedUntil)
          }
        };
      }

      // Check if it's a new day to reset attempts
      if (this.isNewDay(entity.updatedAt)) {
        entity.attempts = 0;
        await entity.save();
      }

      return { success: true, message: 'Not blocked' };
    } catch (error) {
      console.error('Error checking blocked status:', error);
      return { success: false, message: 'Error checking blocked status' };
    }
  }

  async recordAttempt(phoneNumber: string): Promise<void> {
    try {
      let entity = await BlockedEntity.findOne({ phoneNumber });

      if (!entity) {
        entity = new BlockedEntity({ phoneNumber });
      }

      // Reset attempts if it's a new day
      if (this.isNewDay(entity.updatedAt)) {
        entity.attempts = 0;
        entity.blockedUntil = null;
      }

      // Increment attempts
      entity.attempts += 1;

      // Check if should be admin blocked
      if (entity.attempts > this.MAX_DAILY_ATTEMPTS) {
        entity.isAdminBlocked = true;
        console.log(`Phone ${phoneNumber} has been admin blocked due to excessive attempts`);
      } else if (entity.attempts === this.MAX_DAILY_ATTEMPTS) {
        // Set 24-hour block on reaching limit
        entity.blockedUntil = new Date(Date.now() + this.DAILY_BLOCK_DURATION);
        console.log(`Phone ${phoneNumber} has been temporarily blocked for 24 hours`);
      }

      await entity.save();
    } catch (error) {
      console.error('Error recording attempt:', error);
      throw error;
    }
  }

  async unblockByAdmin(phoneNumber: string): Promise<boolean> {
    try {
      // Delete the record completely instead of just updating
      const result = await BlockedEntity.deleteOne({ phoneNumber });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error unblocking:', error);
      throw error;
    }
  }

  async getBlockedEntities(): Promise<IBlockedEntity[]> {
    return BlockedEntity.find({
      $or: [
        { isAdminBlocked: true },
        { blockedUntil: { $gt: new Date() } }
      ]
    }).sort({ updatedAt: -1 });
  }

  private isNewDay(date: Date): boolean {
    const now = new Date();
    const lastAttempt = new Date(date);
    return lastAttempt.getDate() !== now.getDate() ||
           lastAttempt.getMonth() !== now.getMonth() ||
           lastAttempt.getFullYear() !== now.getFullYear();
  }

  private getRemainingTime(blockedUntil: Date): string {
    const remaining = blockedUntil.getTime() - Date.now();
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  }
}