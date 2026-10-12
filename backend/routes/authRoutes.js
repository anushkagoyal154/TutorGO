const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const {
    normalizeEmail,
    isValidEmail,
    createToken,
    hashToken,
    sendVerificationEmail,
    sendPasswordResetEmail
} = require("../services/emailAuthService");

const router = express.Router();

const ROLES = {
    student: {
        table: "Student",
        id: "student_id"
    },
    tutor: {
        table: "Tutor",
        id: "tutor_id"
    }
};

function getRole(roleName) {
    return ROLES[String(roleName || "").toLowerCase()] || null;
}

// GET /api/auth/verify-email?role=student|tutor&token=...
router.get("/verify-email", async (req, res) => {
    const roleName = String(req.query.role || "").toLowerCase();
    const role = getRole(roleName);
    const token = String(req.query.token || "");

    if (!role || !/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({
            error: "Invalid verification link."
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT ${role.id}
             FROM ${role.table}
             WHERE email_verification_token_hash = ?
               AND email_verification_expires > NOW()
             LIMIT 1`,
            [hashToken(token)]
        );

        if (!rows.length) {
            return res.status(400).json({
                error:
                    "This verification link is invalid or expired. Request a new verification email."
            });
        }

        await db.promise().query(
            `UPDATE ${role.table}
             SET email_verified = 1,
                 email_verification_token_hash = NULL,
                 email_verification_expires = NULL
             WHERE ${role.id} = ?`,
            [rows[0][role.id]]
        );

        return res.json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });
    } catch (error) {
        console.error("EMAIL VERIFICATION ERROR:", error);

        return res.status(500).json({
            error: "Could not verify email."
        });
    }
});

// POST /api/auth/resend-verification
// Body: { role, email }
router.post("/resend-verification", async (req, res) => {
    const roleName = String(req.body.role || "").toLowerCase();
    const role = getRole(roleName);
    const email = normalizeEmail(req.body.email);

    if (!role || !isValidEmail(email)) {
        return res.status(400).json({
            error: "Enter a valid email address and account type."
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT ${role.id}, email_verified
             FROM ${role.table}
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        // Avoid disclosing whether an account exists.
        if (rows.length && Number(rows[0].email_verified) !== 1) {
            const token = createToken();

            await db.promise().query(
                `UPDATE ${role.table}
                 SET email_verification_token_hash = ?,
                     email_verification_expires =
                         DATE_ADD(NOW(), INTERVAL 24 HOUR)
                 WHERE ${role.id} = ?`,
                [hashToken(token), rows[0][role.id]]
            );

            await sendVerificationEmail(roleName, email, token);
        }

        return res.json({
            message:
                "If the account exists and needs verification, a verification email will be sent."
        });
    } catch (error) {
        console.error("RESEND VERIFICATION ERROR:", error);

        return res.status(500).json({
            error:
                "Could not send verification email. Check Gmail configuration."
        });
    }
});

// POST /api/auth/forgot-password
// Body: { role, email }
router.post("/forgot-password", async (req, res) => {
    const roleName = String(req.body.role || "").toLowerCase();
    const role = getRole(roleName);
    const email = normalizeEmail(req.body.email);

    if (!role || !isValidEmail(email)) {
        return res.status(400).json({
            error: "Enter a valid email address and account type."
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT ${role.id}, email_verified
             FROM ${role.table}
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        // Return a generic message for account privacy.
        if (rows.length && Number(rows[0].email_verified) === 1) {
            const token = createToken();

            await db.promise().query(
                `UPDATE ${role.table}
                 SET password_reset_token_hash = ?,
                     password_reset_expires =
                         DATE_ADD(NOW(), INTERVAL 30 MINUTE)
                 WHERE ${role.id} = ?`,
                [hashToken(token), rows[0][role.id]]
            );

            await sendPasswordResetEmail(roleName, email, token);
        }

        return res.json({
            message:
                "If a verified account exists for this email, a password-reset link has been sent."
        });
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            error: "Could not send reset email. Check Gmail configuration."
        });
    }
});

// POST /api/auth/reset-password
// Body: { role, token, password }
router.post("/reset-password", async (req, res) => {
    const role = getRole(req.body.role);
    const token = String(req.body.token || "");
    const password = req.body.password;

    if (!role || !/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({
            error: "Invalid password-reset link."
        });
    }

    if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
    ) {
        return res.status(400).json({
            error: "Password must be between 8 and 128 characters."
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT ${role.id}
             FROM ${role.table}
             WHERE password_reset_token_hash = ?
               AND password_reset_expires > NOW()
               AND email_verified = 1
             LIMIT 1`,
            [hashToken(token)]
        );

        if (!rows.length) {
            return res.status(400).json({
                error:
                    "This reset link is invalid, expired, or already used."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await db.promise().query(
            `UPDATE ${role.table}
             SET password = ?,
                 password_reset_token_hash = NULL,
                 password_reset_expires = NULL
             WHERE ${role.id} = ?`,
            [passwordHash, rows[0][role.id]]
        );

        return res.json({
            success: true,
            message: "Password updated. You can now log in."
        });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            error: "Could not reset password."
        });
    }
});

module.exports = router;