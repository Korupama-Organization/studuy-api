import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../models/User';
import { getTokenIssuedAt, verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
    auth?: {
        userId: string;
        role: string;
        payload: JwtPayload;
    };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header thiếu hoặc không đúng định dạng.' });
        }

        let payload: JwtPayload;
        try {
            payload = verifyAccessToken(authHeader.slice(7));
        } catch {
            return res.status(401).json({ error: 'Access token không hợp lệ hoặc đã hết hạn.' });
        }

        if (payload.type !== 'access' || !payload.sub) {
            return res.status(401).json({ error: 'Access token không hợp lệ.' });
        }

        const user = await User.findById(payload.sub);
        if (!user) {
            return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ error: 'Tài khoản đã bị khóa.' });
        }

        // Vô hiệu hóa token cũ nếu mật khẩu đã thay đổi sau khi token được cấp
        const issuedAtMs = getTokenIssuedAt(payload) * 1000;
        const passwordUpdatedAtMs = user.passwordUpdatedAt?.getTime() ?? 0;
        if (issuedAtMs < passwordUpdatedAtMs) {
            return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
        }

        req.auth = {
            userId: String(user._id),
            role: user.role,
            payload,
        };

        return next();
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};
