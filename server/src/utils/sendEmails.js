import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.FROM_EMAIL;

export const sendEmail = async ({ to, subject, html, text }) => {
    const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
    });

    if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
};

export const sendVerificationEmail = async ({ to, name, code }) => {
    return sendEmail({
        to,
        subject: 'Verify your email address',
        html: `
            <h2>Hello ${name},</h2>
            <p>Your email verification code is:</p>
            <h1 style="letter-spacing: 4px;">${code}</h1>
            <p>This code will expire in 10 minutes.</p>
        `,
        text: `Hello ${name}, your verification code is: ${code}. It expires in 10 minutes.`,
    });
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    return sendEmail({
        to,
        subject: 'Password Reset Request',
        html: `
            <h2>Hello ${name},</h2>
            <p>You requested a password reset. Click the link below:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link will expire in 10 minutes. If you did not request this, ignore this email.</p>
        `,
        text: `Hello ${name}, reset your password here: ${resetUrl}. Link expires in 10 minutes.`,
    });
};
