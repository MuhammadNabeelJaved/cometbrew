/**
 * Email test script — runs all 8 email functions and reports pass/fail.
 * Usage: node test-emails.mjs
 */

import 'dotenv/config';
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendJobApplicationConfirmation,
    sendJobApplicationAdminNotification,
    sendSignupConfirmation,
    sendProjectCreated,
    sendProjectCompleted,
    sendFeedbackRequest,
} from './src/utils/sendEmails.js';

const TO = 'graphicsanimation786@gmail.com';
const NAME = 'Nabeel';

const tests = [
    {
        name: '1. Verification Email',
        fn: () => sendVerificationEmail({ to: TO, name: NAME, code: '847291' }),
    },
    {
        name: '2. Password Reset Email',
        fn: () => sendPasswordResetEmail({
            to: TO,
            name: NAME,
            resetUrl: 'http://localhost:5173/reset-password?token=test-token-123',
        }),
    },
    {
        name: '3. Job Application Confirmation (to applicant)',
        fn: () => sendJobApplicationConfirmation({
            to: TO,
            name: NAME,
            jobTitle: 'Senior Frontend Developer',
            department: 'Engineering',
        }),
    },
    {
        name: '4. Job Application Admin Notification',
        fn: () => sendJobApplicationAdminNotification({
            to: TO,
            applicantName: 'Ali Hassan',
            applicantEmail: 'ali@example.com',
            jobTitle: 'Senior Frontend Developer',
            department: 'Engineering',
            applicationId: '6643abc123def456789012ab',
        }),
    },
    {
        name: '5. Signup Confirmation',
        fn: () => sendSignupConfirmation({ to: TO, name: NAME }),
    },
    {
        name: '6. Project Created',
        fn: () => sendProjectCreated({
            to: TO,
            name: NAME,
            projectName: 'E-Commerce Website',
            projectType: 'Web Development',
            budgetRange: '$5,000 – $10,000',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
    },
    {
        name: '7. Project Completed',
        fn: () => sendProjectCompleted({
            to: TO,
            name: NAME,
            projectName: 'E-Commerce Website',
        }),
    },
    {
        name: '8. Feedback Request',
        fn: () => sendFeedbackRequest({
            to: TO,
            name: NAME,
            projectName: 'E-Commerce Website',
        }),
    },
];

console.log(`\n📧  Testing all emails → sending to: ${TO}`);
console.log(`    FROM: ${process.env.FROM_EMAIL}\n`);
console.log('─'.repeat(55));

let passed = 0;
let failed = 0;

for (const test of tests) {
    process.stdout.write(`${test.name} ... `);
    try {
        const result = await test.fn();
        console.log(`✅  id: ${result?.id ?? 'ok'}`);
        passed++;
    } catch (err) {
        console.log(`❌  ${err.message}`);
        failed++;
    }
}

console.log('─'.repeat(55));
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
