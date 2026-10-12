const crypto = require("crypto");
const nodemailer = require("nodemailer");

function normalizeEmail(value) {
    return typeof value === "string"
        ? value.trim().toLowerCase()
        : "";
}

// Checks email syntax; the verification link confirms ownership.
function isValidEmail(value) {
    const email = normalizeEmail(value);

    return (
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    );
}

function createToken() {
    return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

function getTransporter() {
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        throw new Error(
            "Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env."
        );
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD
        }
    });
}

async function sendLinkEmail({
    to,
    subject,
    heading,
    message,
    url,
    buttonText
}) {
    const transporter = getTransporter();

    await transporter.sendMail({
        from: `"TutorGo" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text: `${heading}\n\n${message}\n\n${url}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222">
                <h2 style="color:#6d28d9">${heading}</h2>
                <p>${message}</p>
                <p>
                    <a href="${url}"
                       style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">
                        ${buttonText}
                    </a>
                </p>
                <p>If the button does not work, copy this URL:</p>
                <p style="word-break:break-all">${url}</p>
                <p>If you did not request this, ignore this email.</p>
            </div>`
    });
}

async function sendVerificationEmail(role, email, token) {
    const frontendUrl = (
        process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    const url =
        `${frontendUrl}/verify-email?role=${encodeURIComponent(role)}` +
        `&token=${encodeURIComponent(token)}`;

    return sendLinkEmail({
        to: email,
        subject: "Verify your TutorGo email",
        heading: "Verify your TutorGo email",
        message:
            "Confirm that you own this email address to activate your TutorGo account. This link expires in 24 hours.",
        url,
        buttonText: "Verify email"
    });
}

async function sendPasswordResetEmail(role, email, token) {
    const frontendUrl = (
        process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    const url =
        `${frontendUrl}/reset-password?role=${encodeURIComponent(role)}` +
        `&token=${encodeURIComponent(token)}`;

    return sendLinkEmail({
        to: email,
        subject: "Reset your TutorGo password",
        heading: "Reset your TutorGo password",
        message:
            "Use this link to choose a new password. It expires in 30 minutes and can be used once.",
        url,
        buttonText: "Reset password"
    });
}

module.exports = {
    normalizeEmail,
    isValidEmail,
    createToken,
    hashToken,
    sendVerificationEmail,
    sendPasswordResetEmail
};