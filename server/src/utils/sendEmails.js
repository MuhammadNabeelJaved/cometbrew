/**
 * Email utility – wraps the Resend SDK for transactional emails.
 *
 * Required environment variables:
 *   RESEND_API_KEY – Resend API key
 *   FROM_EMAIL     – Verified sender address (e.g. "no-reply@yourdomain.com")
 *   CLIENT_URL     – Frontend base URL (e.g. "https://nabeel.agency")
 */
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Template files live at: server/email-templates/
const TEMPLATES_DIR = path.resolve(__dirname, '../../email-templates');

// Initialise Resend client with the API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address — read dynamically so env overrides in tests work correctly

/**
 * Loads an HTML template file and replaces all {{KEY}} placeholders.
 *
 * @param {string} filename  - Template filename (e.g. "1-verification-email.html")
 * @param {Object} vars      - Key-value map of placeholder replacements
 * @returns {string}         - Rendered HTML string
 */
const renderTemplate = (filename, vars = {}) => {
    const filePath = path.join(TEMPLATES_DIR, filename);
    let html = fs.readFileSync(filePath, 'utf8');
    for (const [key, value] of Object.entries(vars)) {
        // Replace all occurrences of {{KEY}}
        html = html.replaceAll(`{{${key}}}`, value ?? '');
    }
    return html;
};

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
        from: process.env.FROM_EMAIL,
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
    const digits = String(code).padStart(6, '0').split('');

    const html = renderTemplate('1-verification-email.html', {
        NAME: name,
        CODE: code,
        D1: digits[0],
        D2: digits[1],
        D3: digits[2],
        D4: digits[3],
        D5: digits[4],
        D6: digits[5],
    });

    return sendEmail({
        to,
        subject: 'Verify your email address — Nabeel Agency',
        html,
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
    const html = renderTemplate('2-password-reset-email.html', {
        NAME: name,
        RESET_URL: resetUrl,
    });

    return sendEmail({
        to,
        subject: 'Password Reset Request — Nabeel Agency',
        html,
        text: `Hello ${name}, reset your password here: ${resetUrl}. Link expires in 10 minutes.`,
    });
};

/**
 * Sends a confirmation email to the job applicant after they submit an application.
 *
 * @param {Object} options
 * @param {string} options.to         - Applicant email address
 * @param {string} options.name       - Applicant first name
 * @param {string} options.jobTitle   - Title of the job they applied for
 * @param {string} options.department - Department of the job
 * @returns {Promise<Object>} Resend response data
 */
export const sendJobApplicationConfirmation = async ({ to, name, jobTitle, department }) => {
    const html = renderTemplate('3-job-application-confirmation.html', {
        NAME: name,
        JOB_TITLE: jobTitle,
        DEPARTMENT: department,
        CLIENT_URL: process.env.CLIENT_URL || 'https://nabeel.agency',
    });

    return sendEmail({
        to,
        subject: `Application Received — ${jobTitle}`,
        html,
        text: `Hi ${name}, we received your application for ${jobTitle} (${department}). Our team will review it and reach out if your profile matches. Decisions are communicated within 2–3 weeks. — Nabeel Agency`,
    });
};

/**
 * Notifies the admin that a new job application was submitted.
 *
 * @param {Object} options
 * @param {string} options.to             - Admin email address
 * @param {string} options.applicantName  - Full name of the applicant
 * @param {string} options.applicantEmail - Email of the applicant
 * @param {string} options.jobTitle       - Job title applied for
 * @param {string} options.department     - Department
 * @param {string} options.applicationId  - MongoDB _id of the application
 * @returns {Promise<Object>} Resend response data
 */
export const sendJobApplicationAdminNotification = async ({
    to,
    applicantName,
    applicantEmail,
    jobTitle,
    department,
    applicationId,
}) => {
    const adminUrl = `${process.env.CLIENT_URL || 'https://nabeel.agency'}/admin/job-applications`;

    const submittedAt = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });

    const html = renderTemplate('4-job-application-admin-notification.html', {
        APPLICANT_NAME: applicantName,
        APPLICANT_EMAIL: applicantEmail,
        JOB_TITLE: jobTitle,
        DEPARTMENT: department,
        APPLICATION_ID: applicationId,
        ADMIN_URL: adminUrl,
        SUBMITTED_AT: submittedAt,
    });

    return sendEmail({
        to,
        subject: `New Application: ${applicantName} applied for ${jobTitle}`,
        html,
        text: `New application from ${applicantName} (${applicantEmail}) for ${jobTitle} (${department}). View at: ${adminUrl}`,
    });
};

/**
 * Sends a welcome/signup confirmation email after the user verifies their account.
 */
export const sendSignupConfirmation = async ({ to, name }) => {
    const clientUrl = process.env.CLIENT_URL || 'https://nabeel.agency';

    const html = renderTemplate('5-signup-confirmation.html', {
        NAME: name,
        EMAIL: to,
        DASHBOARD_URL: `${clientUrl}/user-dashboard`,
        CLIENT_URL: clientUrl,
    });

    return sendEmail({
        to,
        subject: 'Welcome to Nabeel Agency — Account Verified!',
        html,
        text: `Hi ${name}, welcome to Nabeel Agency! Your account has been verified. Visit your dashboard: ${clientUrl}/user-dashboard`,
    });
};

/**
 * Sends a confirmation email when a user submits a new project request.
 */
export const sendProjectCreated = async ({ to, name, projectName, projectType, budgetRange, deadline }) => {
    const clientUrl = process.env.CLIENT_URL || 'https://nabeel.agency';

    const deadlineStr = deadline
        ? new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Not set';

    const html = renderTemplate('6-project-created.html', {
        NAME: name,
        PROJECT_NAME: projectName,
        PROJECT_INITIAL: (projectName || 'P')[0].toUpperCase(),
        PROJECT_TYPE: projectType || 'Web Development',
        BUDGET_RANGE: budgetRange || 'To be discussed',
        DEADLINE: deadlineStr,
        DASHBOARD_URL: `${clientUrl}/user-dashboard`,
    });

    return sendEmail({
        to,
        subject: `Project "${projectName}" received — Nabeel Agency`,
        html,
        text: `Hi ${name}, your project "${projectName}" has been received and is under review. We'll be in touch within 1–2 business days.`,
    });
};

/**
 * Sends a project-completed notification + prompts for feedback.
 */
export const sendProjectCompleted = async ({ to, name, projectName }) => {
    const clientUrl = process.env.CLIENT_URL || 'https://nabeel.agency';
    const completedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const html = renderTemplate('7-project-completed.html', {
        NAME: name,
        PROJECT_NAME: projectName,
        COMPLETED_DATE: completedDate,
        FEEDBACK_URL: `${clientUrl}/user-dashboard/reviews`,
        DASHBOARD_URL: `${clientUrl}/user-dashboard`,
    });

    return sendEmail({
        to,
        subject: `🎉 Project "${projectName}" is complete! — Nabeel Agency`,
        html,
        text: `Hi ${name}, your project "${projectName}" has been completed! Leave feedback at: ${clientUrl}/user-dashboard/reviews`,
    });
};

/**
 * Sends a standalone feedback request email.
 */
export const sendFeedbackRequest = async ({ to, name, projectName }) => {
    const clientUrl = process.env.CLIENT_URL || 'https://nabeel.agency';

    const html = renderTemplate('8-feedback-request.html', {
        NAME: name,
        PROJECT_NAME: projectName,
        FEEDBACK_URL: `${clientUrl}/user-dashboard/reviews`,
    });

    return sendEmail({
        to,
        subject: `How did we do on "${projectName}"? — Nabeel Agency`,
        html,
        text: `Hi ${name}, we'd love your feedback on the "${projectName}" project. Share your review: ${clientUrl}/user-dashboard/reviews`,
    });
};
