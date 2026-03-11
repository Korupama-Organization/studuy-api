import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { APP_CONFIG } from '../constants';

type TokenType = 'access' | 'refresh' | 'reset_password';

interface TokenPayload {
    sub: string;
    role?: 'student' | 'teacher' | 'admin';
    type: TokenType;
}

const signToken = (payload: TokenPayload, secret: string, expiresIn: SignOptions['expiresIn']): string => {
    const options: SignOptions = {
        expiresIn,
    };

    return jwt.sign(payload, secret, options);
};

export const generateAccessToken = (userId: string, role: 'student' | 'teacher' | 'admin'): string => {
    return signToken(
        { sub: userId, role, type: 'access' },
        APP_CONFIG.jwtSecret,
        APP_CONFIG.accessTokenExpiresIn as SignOptions['expiresIn']
    );
};

export const generateRefreshToken = (userId: string): string => {
    return signToken(
        { sub: userId, type: 'refresh' },
        APP_CONFIG.refreshTokenSecret,
        APP_CONFIG.refreshTokenExpiresIn as SignOptions['expiresIn']
    );
};

export const generateResetPasswordToken = (userId: string): string => {
    return signToken(
        { sub: userId, type: 'reset_password' },
        APP_CONFIG.resetPasswordSecret,
        APP_CONFIG.resetPasswordExpiresIn as SignOptions['expiresIn']
    );
};

const verifyToken = (token: string, secret: string): JwtPayload => {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string') {
        throw new Error('Invalid token payload');
    }
    return decoded;
};

export const verifyAccessToken = (token: string): JwtPayload => verifyToken(token, APP_CONFIG.jwtSecret);
export const verifyRefreshToken = (token: string): JwtPayload => verifyToken(token, APP_CONFIG.refreshTokenSecret);
export const verifyResetPasswordToken = (token: string): JwtPayload => verifyToken(token, APP_CONFIG.resetPasswordSecret);

export const getTokenIssuedAt = (payload: JwtPayload): number => {
    return typeof payload.iat === 'number' ? payload.iat : 0;
};
