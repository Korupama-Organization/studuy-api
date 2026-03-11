import nodemailer from 'nodemailer';
import { APP_CONFIG } from '../constants';

export type OtpEmailPurpose = 'verify_email' | 'forgot_password';

const transporter = nodemailer.createTransport({
    host: APP_CONFIG.smtpHost,
    port: APP_CONFIG.smtpPort,
    secure: APP_CONFIG.smtpSecure,
    auth: {
        user: APP_CONFIG.smtpUser,
        pass: APP_CONFIG.smtpPass,
    },
});

const ttlMinutes = Math.ceil(APP_CONFIG.otpTtlSeconds / 60);

const TEMPLATES: Record<OtpEmailPurpose, (otp: string) => { subject: string; html: string }> = {
    verify_email: (otp) => ({
        subject: '[Studuy] Mã OTP xác thực email của bạn',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:8px">
                <h2 style="color:#1d4ed8;margin-bottom:8px">Xác thực địa chỉ email</h2>
                <p>Xin chào,</p>
                <p>Bạn vừa đăng ký tài khoản trên <strong>Studuy</strong>. Vui lòng sử dụng mã OTP dưới đây để hoàn tất xác thực:</p>
                <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f3f4f6;border-radius:6px;margin:24px 0">${otp}</div>
                <p style="color:#6b7280;font-size:13px">Mã có hiệu lực trong <strong>${ttlMinutes} phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
                <p style="color:#6b7280;font-size:13px">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
            </div>
        `,
    }),
    forgot_password: (otp) => ({
        subject: '[Studuy] Mã OTP đặt lại mật khẩu',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:8px">
                <h2 style="color:#dc2626;margin-bottom:8px">Đặt lại mật khẩu</h2>
                <p>Xin chào,</p>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu tài khoản <strong>Studuy</strong> của bạn. Sử dụng mã OTP sau để tiếp tục:</p>
                <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#fef2f2;border-radius:6px;margin:24px 0">${otp}</div>
                <p style="color:#6b7280;font-size:13px">Mã có hiệu lực trong <strong>${ttlMinutes} phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
                <p style="color:#6b7280;font-size:13px">Nếu bạn không yêu cầu điều này, tài khoản của bạn vẫn an toàn và bạn có thể bỏ qua email này.</p>
            </div>
        `,
    }),
};

export const sendOtpEmail = async (to: string, purpose: OtpEmailPurpose, otp: string): Promise<void> => {
    const { subject, html } = TEMPLATES[purpose](otp);
    await transporter.sendMail({
        from: `"${APP_CONFIG.smtpFromName}" <${APP_CONFIG.smtpFromEmail}>`,
        to,
        subject,
        html,
    });
};
