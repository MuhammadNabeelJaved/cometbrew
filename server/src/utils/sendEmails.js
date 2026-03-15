/**
 * Email utility – wraps the Resend SDK for transactional emails.
 *
 * Required environment variables:
 *   RESEND_API_KEY – Resend API key
 *   FROM_EMAIL     – Verified sender address (e.g. "no-reply@yourdomain.com")
 */
import { Resend } from 'resend';

// Initialise Resend client with the API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address used for all outbound emails
const from = process.env.FROM_EMAIL;

/**
 * Base email sender. All other helpers delegate to this function.
 *
 * @param {Object} options
 * @param {string|string[]} options.to      - Recipient address(es)
 * @param {string}          options.subject - Email subject line
 * @param {string}          options.html    - HTML body
 * @param {string}          options.text    - Plain-text fallback body
 * @returns {Promise<Object>} Resend response data
 * @throws {Error} If the Resend API returns an error
 */
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

/**
 * Sends a 6-digit email verification code to a newly registered user.
 *
 * @param {Object} options
 * @param {string} options.to   - Recipient email address
 * @param {string} options.name - User's display name (used in the greeting)
 * @param {string} options.code - 6-digit numeric verification code
 * @returns {Promise<Object>} Resend response data
 */
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

/**
 * Sends a password-reset link to a user who requested a password reset.
 *
 * @param {Object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.name     - User's display name
 * @param {string} options.resetUrl - Signed reset URL (expires in 10 minutes)
 * @returns {Promise<Object>} Resend response data
 */
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
