import { randomInt } from 'crypto';
import { APP_CONFIG } from '../constants';

// Dùng crypto.randomInt để tạo OTP an toàn về mặt mật mã (cryptographically secure)
export const generateOtpCode = (): string => {
    const length = Math.max(4, Math.min(APP_CONFIG.otpLength, 8));
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length); // randomInt trả về [min, max)
    return String(randomInt(min, max));
};
