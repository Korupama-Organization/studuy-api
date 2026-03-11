import { Router } from 'express';
import {
	loginUser,
	refreshAccessToken,
	registerUser,
	requestForgotPassword,
	resendForgotPasswordOtp,
	resendVerifyEmailOtp,
	resetPassword,
	verifyEmailOtp,
	verifyForgotPasswordOtp,
} from '../controllers/auth.controller';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới và gửi OTP xác thực email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc email/phone đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', registerUser);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Xác thực email bằng OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       200:
 *         description: Xác thực email thành công
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-email', verifyEmailOtp);

/**
 * @swagger
 * /api/auth/resend-verify-email-otp:
 *   post:
 *     summary: Gửi lại OTP xác thực email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Gửi lại OTP thành công
 *       400:
 *         description: Email đã xác thực hoặc đang trong thời gian cooldown
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/resend-verify-email-otp', resendVerifyEmailOtp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập bằng email và mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       400:
 *         description: Thiếu dữ liệu đầu vào
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Sai thông tin đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Email chưa xác thực hoặc tài khoản bị chặn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Cấp lại access token từ refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Cấp token mới thành công
 *       400:
 *         description: Thiếu refresh_token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Refresh token không hợp lệ/hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', refreshAccessToken);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Gửi OTP quên mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Yêu cầu đã được xử lý
 *       400:
 *         description: Thiếu email hoặc đang cooldown
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/forgot-password', requestForgotPassword);

/**
 * @swagger
 * /api/auth/verify-forgot-password-otp:
 *   post:
 *     summary: Xác thực OTP quên mật khẩu và cấp reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       200:
 *         description: OTP hợp lệ, cấp reset token
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);

/**
 * @swagger
 * /api/auth/resend-forgot-password-otp:
 *   post:
 *     summary: Gửi lại OTP quên mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Yêu cầu đã được xử lý
 *       400:
 *         description: Thiếu email hoặc đang cooldown
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/resend-forgot-password-otp', resendForgotPasswordOtp);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset mật khẩu bằng reset password token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Thiếu dữ liệu hoặc mật khẩu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Reset token không hợp lệ/hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reset-password', resetPassword);

export default router;

