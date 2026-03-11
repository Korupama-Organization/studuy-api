import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, IUser } from '../models/User';
import { APP_CONFIG, REDIS_KEYS } from '../constants';
import { sendOtpEmail } from '../utils/email';
import { generateOtpCode } from '../utils/otp';
import { deleteTempValue, existsTempValue, getTempValue, setTempValue } from '../utils/redis';
import {
    generateAccessToken,
    generateRefreshToken,
    generateResetPasswordToken,
    getTokenIssuedAt,
    verifyRefreshToken,
    verifyResetPasswordToken,
} from '../utils/jwt';

// ─── Private helpers ─────────────────────────────────────────────────────────────

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashPassword = async (plain: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
};

const sanitizeUser = (user: IUser) => {
    const { password: _, ...safe } = user.toObject() as any;
    return safe;
};

/**
 * Tạo OTP mới, lưu vào Redis và gửi qua email.
 * Nếu đang trong thời gian cooldown thì ném lỗi với statusCode 429.
 */
const sendOtp = async (
    email: string,
    purpose: 'verify_email' | 'forgot_password',
): Promise<void> => {
    const otpKey = purpose === 'verify_email'
        ? REDIS_KEYS.verifyEmailOtp(email)
        : REDIS_KEYS.forgotPasswordOtp(email);
    const cooldownKey = purpose === 'verify_email'
        ? REDIS_KEYS.verifyEmailCooldown(email)
        : REDIS_KEYS.forgotPasswordCooldown(email);

    const onCooldown = await existsTempValue(cooldownKey);
    if (onCooldown) {
        const err: any = new Error(
            `Vui lòng chờ ${APP_CONFIG.otpResendCooldownSeconds} giây trước khi yêu cầu OTP mới.`,
        );
        err.statusCode = 429;
        throw err;
    }

    const otp = generateOtpCode();
    await setTempValue(otpKey, otp, APP_CONFIG.otpTtlSeconds);
    await setTempValue(cooldownKey, '1', APP_CONFIG.otpResendCooldownSeconds);
    await sendOtpEmail(email, purpose, otp);
};

/**
 * POST /api/auth/register
 * Tạo tài khoản mới và gửi OTP xác thực email.
 */
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { fullName, email, phone, password, role, avatar, authProvider, teacherProfile } = req.body;

        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ error: 'fullName, email, phone và password là bắt buộc.' });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        const normalizedEmail = normalizeEmail(email);
        const assignRole: IUser['role'] = role || 'student';

        // Kiểm tra email trùng
        const existingByEmail = await User.findOne({ email: normalizedEmail });
        if (existingByEmail) {
            if (!existingByEmail.emailVerified) {
                return res.status(409).json({
                    error: 'Email đã được đăng ký nhưng chưa xác thực. Vui lòng sử dụng API gửi lại OTP.',
                    code: 'EMAIL_UNVERIFIED',
                });
            }
            return res.status(409).json({ error: 'Email đã được sử dụng.' });
        }

        // Kiểm tra số điện thoại trùng
        const existingByPhone = await User.findOne({ phone });
        if (existingByPhone) {
            return res.status(409).json({ error: 'Số điện thoại đã được sử dụng.' });
        }

        if ((assignRole === 'student' || assignRole === 'admin') && teacherProfile) {
            return res.status(400).json({ error: `Tài khoản ${assignRole} không thể có thông tin giáo viên.` });
        }

        // Tạo user — rollback nếu gửi OTP thất bại
        const newUser = await User.create({
            fullName,
            email: normalizedEmail,
            phone,
            password: await hashPassword(password),
            role: assignRole,
            avatar,
            authProvider: authProvider || 'local',
            isBlocked: false,
            emailVerified: false,
            ...(assignRole === 'teacher' && teacherProfile ? { teacherProfile } : {}),
        });

        try {
            await sendOtp(normalizedEmail, 'verify_email');
        } catch {
            await User.findByIdAndDelete(newUser._id);
            return res.status(500).json({ error: 'Không thể gửi email OTP. Vui lòng thử lại.' });
        }

        return res.status(201).json({
            message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.',
            user: sanitizeUser(newUser),
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};

/**
 * POST /api/auth/verify-email
 * Xác thực email bằng OTP. Kích hoạt tài khoản sau khi xác thực thành công.
 */
export const verifyEmailOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'email và otp là bắt buộc.' });
        }

        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email đã được xác thực trước đó.' });
        }

        const storedOtp = await getTempValue(REDIS_KEYS.verifyEmailOtp(normalizedEmail));
        if (!storedOtp || storedOtp !== String(otp)) {
            return res.status(400).json({ error: 'OTP không đúng hoặc đã hết hạn.' });
        }

        user.emailVerified = true;
        await user.save();

        // Xóa cả OTP key lẫn cooldown key
        await Promise.all([
            deleteTempValue(REDIS_KEYS.verifyEmailOtp(normalizedEmail)),
            deleteTempValue(REDIS_KEYS.verifyEmailCooldown(normalizedEmail)),
        ]);

        return res.status(200).json({ message: 'Xác thực email thành công. Bạn có thể đăng nhập.' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};

/**
 * POST /api/auth/resend-verify-email-otp
 * Gửi lại OTP xác thực email (có cooldown).
 */
export const resendVerifyEmailOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'email là bắt buộc.' });
        }

        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
        }
        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email đã được xác thực.' });
        }

        await sendOtp(normalizedEmail, 'verify_email');

        return res.status(200).json({ message: 'OTP đã được gửi lại. Vui lòng kiểm tra email.' });
    } catch (error: any) {
        const status = (error as any).statusCode || 500;
        return res.status(status).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};

/**
 * POST /api/auth/login
 * Đăng nhập. Trả về access_token và refresh_token.
 * Chặn đăng nhập nếu email chưa xác thực hoặc tài khoản bị khóa.
 */
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email và password là bắt buộc.' });
        }

        const normalizedEmail = normalizeEmail(email);
        // select +password vì field có select: false trong schema
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        // Dùng thông báo chung cho cả "user không tồn tại" và "sai mật khẩu" để chống user enumeration
        if (!user) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                error: 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư và nhập OTP.',
                code: 'EMAIL_UNVERIFIED',
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({ error: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
        }

        return res.status(200).json({
            message: 'Đăng nhập thành công.',
            access_token: generateAccessToken(String(user._id), user.role),
            refresh_token: generateRefreshToken(String(user._id)),
            user: sanitizeUser(user),
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};

/**
 * POST /api/auth/refresh
 * Đổi refresh token lấy cặp token mới (token rotation).
 * Từ chối nếu mật khẩu đã thay đổi sau khi token được cấp.
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ error: 'refresh_token là bắt buộc.' });
        }

        let payload;
        try {
            payload = verifyRefreshToken(refresh_token);
        } catch {
            return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn.' });
        }

        if (payload.type !== 'refresh' || !payload.sub) {
            return res.status(401).json({ error: 'Refresh token không hợp lệ.' });
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
            return res.status(401).json({
                error: 'Phiên đăng nhập đã hết hạn do mật khẩu thay đổi. Vui lòng đăng nhập lại.',
            });
        }

        return res.status(200).json({
            message: 'Cấp token mới thành công.',
            access_token: generateAccessToken(String(user._id), user.role),
            refresh_token: generateRefreshToken(String(user._id)),
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};

/**
 * POST /api/auth/forgot-password
 * Gửi OTP về email để đặt lại mật khẩu.
 * Luôn trả về 200 (không tiết lộ email có tồn tại hay không — chống user enumeration).
 * Chỉ trả về 429 khi đang trong thời gian cooldown.
 */
export const requestForgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'email là bắt buộc.' });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Gửi OTP. Nếu cooldown thì throwout 429; lỗi SMTP khác — im lặng (không tiết lộ).
            try {
                await sendOtp(normalizedEmail, 'forgot_password');
            } catch (err: any) {
                if (err.statusCode === 429) throw err; // propagate cooldown error
                // SMTP failure: im lặng, vẫn trả về 200
            }
        }

        return res.status(200).json({
            message: 'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.',
        });
    } catch (error: any) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};

/**
 * POST /api/auth/verify-forgot-password-otp
 * Xác thực OTP quên mật khẩu. Trả về reset_token để dùng ở bước tiếp theo.
 */
export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'email và otp là bắt buộc.' });
        }

        const normalizedEmail = normalizeEmail(email);

        const storedOtp = await getTempValue(REDIS_KEYS.forgotPasswordOtp(normalizedEmail));
        if (!storedOtp || storedOtp !== String(otp)) {
            return res.status(400).json({ error: 'OTP không đúng hoặc đã hết hạn.' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
        }

        await Promise.all([
            deleteTempValue(REDIS_KEYS.forgotPasswordOtp(normalizedEmail)),
            deleteTempValue(REDIS_KEYS.forgotPasswordCooldown(normalizedEmail)),
        ]);

        return res.status(200).json({
            message: 'Xác thực OTP thành công.',
            reset_token: generateResetPasswordToken(String(user._id)),
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};

/**
 * POST /api/auth/resend-forgot-password-otp
 * Gửi lại OTP quên mật khẩu. Delegate hoàn toàn sang requestForgotPassword — không trùng lặp logic.
 */
export const resendForgotPasswordOtp = (req: Request, res: Response) =>
    requestForgotPassword(req, res);

/**
 * POST /api/auth/reset-password
 * Đặt lại mật khẩu bằng reset_token nhận từ verifyForgotPasswordOtp.
 * Cập nhật passwordUpdatedAt để vô hiệu hóa tất cả access/refresh token cũ.
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { reset_token, new_password } = req.body;
        if (!reset_token || !new_password) {
            return res.status(400).json({ error: 'reset_token và new_password là bắt buộc.' });
        }
        if (String(new_password).length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        let payload;
        try {
            payload = verifyResetPasswordToken(reset_token);
        } catch {
            return res.status(401).json({ error: 'Reset token không hợp lệ hoặc đã hết hạn.' });
        }

        if (payload.type !== 'reset_password' || !payload.sub) {
            return res.status(401).json({ error: 'Reset token không hợp lệ.' });
        }

        const user = await User.findById(payload.sub).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
        }

        user.password = await hashPassword(new_password);
        user.passwordUpdatedAt = new Date();
        await user.save();

        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Lỗi máy chủ.' });
    }
};
