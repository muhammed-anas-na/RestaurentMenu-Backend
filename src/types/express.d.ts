import { DeviceInfo } from './security.types';

declare global {
  namespace Express {
    interface Request {
      deviceInfo: DeviceInfo;
    }
  }
}