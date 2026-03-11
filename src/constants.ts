const asNumber = (value: string | undefined, fallback: number): number => {
	if (!value) {
		return fallback;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value: string | undefined, fallback: boolean): boolean => {
	if (value === undefined) {
		return fallback;
	}

	return value.toLowerCase() === 'true';
};

const required = (name: string, fallback?: string): string => {
	const value = process.env[name] || fallback;
	if (!value) {
		throw new Error(`${name} is required`);
	}
	return value;
};

export const APP_CONFIG = {
	jwtSecret: required('JWT_SECRET', 'fallback_secret'),
	accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
	refreshTokenSecret: required('JWT_REFRESH_SECRET', process.env.JWT_SECRET),
	refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
	resetPasswordSecret: required('JWT_RESET_PASSWORD_SECRET', process.env.JWT_SECRET),
	resetPasswordExpiresIn: process.env.JWT_RESET_PASSWORD_EXPIRES_IN || '15m',
	redisUsername: process.env.REDIS_USERNAME || 'default',
	redisPassword: process.env.REDIS_PASSWORD || '',
	redisHost: process.env.REDIS_HOST || '127.0.0.1',
	redisPort: asNumber(process.env.REDIS_PORT, 6379),
	otpLength: asNumber(process.env.OTP_LENGTH, 6),
	otpTtlSeconds: asNumber(process.env.OTP_TTL_SECONDS, 300),
	otpResendCooldownSeconds: asNumber(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
	smtpHost: required('SMTP_HOST', 'localhost'),
	smtpPort: asNumber(process.env.SMTP_PORT, 587),
	smtpSecure: asBoolean(process.env.SMTP_SECURE, false),
	smtpUser: required('SMTP_USER', 'username'),
	smtpPass: required('SMTP_PASS', 'password'),
	smtpFromName: process.env.SMTP_FROM_NAME || 'Studuy',
	smtpFromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@studuy.local',
	appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
};

export const REDIS_KEYS = {
	verifyEmailOtp: (email: string) => `auth:verify-email:otp:${email.toLowerCase()}`,
	verifyEmailCooldown: (email: string) => `auth:verify-email:cooldown:${email.toLowerCase()}`,
	forgotPasswordOtp: (email: string) => `auth:forgot-password:otp:${email.toLowerCase()}`,
	forgotPasswordCooldown: (email: string) => `auth:forgot-password:cooldown:${email.toLowerCase()}`,
};
