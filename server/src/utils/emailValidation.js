/**
 * Real-email validation for public signup.
 *
 * Accepts any personal or business address, but rejects:
 *  1. Malformed addresses (format check)
 *  2. Disposable / temp-mail domains (disposable-email-domains blocklist)
 *  3. Domains that can't receive mail (no MX record)
 *
 * Inbox ownership itself is proven later by the existing OTP verification.
 */
import dns from "dns/promises";
import validator from "validator";
import { createRequire } from "module";
import AppError from "./AppError.js";

const require = createRequire(import.meta.url);
const disposableDomains = new Set(require("disposable-email-domains"));

export const validateRealEmail = async (email) => {
    if (!validator.isEmail(email)) {
        throw new AppError("Please provide a valid email address", 400);
    }

    const domain = email.split("@").pop().toLowerCase();

    if (disposableDomains.has(domain)) {
        throw new AppError(
            "Temporary or disposable email addresses are not allowed. Please use your personal or business email.",
            400
        );
    }

    const notFound = new AppError("This email domain does not exist. Please use a real email address.", 400);

    try {
        const mx = await dns.resolveMx(domain);
        if (!mx?.length) throw notFound;
    } catch (err) {
        if (err instanceof AppError) throw err;
        if (err.code === "ENOTFOUND" || err.code === "ENODATA") throw notFound;
        // c-ares query failed (resolver quirk) — retry via the OS resolver before giving up
        try {
            await dns.lookup(domain);
        } catch (lookupErr) {
            if (lookupErr.code === "ENOTFOUND") throw notFound;
            // ponytail: DNS fully offline → fail open, OTP still gates the inbox
        }
    }
};
