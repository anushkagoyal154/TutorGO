
const crypto = require("crypto");
const nodemailer = require("nodemailer");

function normalizeEmail(value) {
    return typeof value === "string"
        ? value.trim().toLowerCase()
        : "";
}

function isValidEmail(value) {
    const email = normalizeEmail(value);

    return (
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    );
}

function createOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

function createToken() {
    return crypto.randomBytes(32).toString("hex");
}

function hashToken(value) {
    return crypto
        .createHash("sha256")
        .update(value)
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

async function sendOtpEmail(email, otp, purpose) {
    const transporter = getTransporter();

    const isReset = purpose === "password_reset";
    const subject = isReset
        ? "Your TutorGo password reset code"
        : "Your TutorGo verification code";

    const heading = isReset
        ? "Reset your TutorGo password"
        : "Verify your TutorGo email";

    await transporter.sendMail({
        from: `"TutorGo" <${process.env.GMAIL_USER}>`,
        to: email,
        subject,
        text:
            `Your TutorGo code is ${otp}.\n\n` +
            "It expires in 10 minutes. Do not share it with anyone.",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#222">
                <h2 style="color:#4f46e5">${heading}</h2>
                <p>Enter this code in TutorGo:</p>
                <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4f46e5;padding:16px 0">
                    ${otp}
                </div>
                <p>This code expires in <strong>10 minutes</strong>.</p>
                <p>If you did not request this code, ignore this email.</p>
            </div>
        `
    });
}

module.exports = {
    normalizeEmail,
    isValidEmail,
    createOtp,
    createToken,
    hashToken,
    sendOtpEmail
};
