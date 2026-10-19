
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const {
    normalizeEmail,
    isValidEmail,
    createOtp,
    createToken,
    hashToken,
    sendOtpEmail
} = require("../services/emailAuthService");

const router = express.Router();

const ROLES = {
    student: { table: "Student", id: "student_id" },
    tutor: { table: "Tutor", id: "tutor_id" }
};

function getRole(value) {
    return ROLES[String(value || "").toLowerCase()] || null;
}

function validPassword(password) {
    return (
        typeof password === "string" &&
        password.length >= 8 &&
        password.length <= 128
    );
}

async function saveOtp(email, roleName, purpose) {
    const otp = createOtp();

    await db.promise().query(
        `DELETE FROM AuthOTP
         WHERE email = ? AND role = ? AND purpose = ?`,
        [email, roleName, purpose]
    );

    await db.promise().query(
        `INSERT INTO AuthOTP
            (email, role, purpose, otp_hash, expires_at, attempts)
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)`,
        [email, roleName, purpose, hashToken(otp)]
    );

    try {
        await sendOtpEmail(email, otp, purpose);
    } catch (error) {
        await db.promise().query(
            `DELETE FROM AuthOTP
             WHERE email = ? AND role = ? AND purpose = ?`,
            [email, roleName, purpose]
        );
        throw error;
    }
}

// POST /api/auth/registration/send-otp
// Body: { role, email }
router.post("/registration/send-otp", async (req, res) => {
    const roleName = String(req.body.role || "").toLowerCase();
    const role = getRole(roleName);
    const email = normalizeEmail(req.body.email);

    if (!role || !isValidEmail(email)) {
        return res.status(400).json({
            error: "Enter a valid email address and account type."
        });
    }

    try {
        const [accounts] = await db.promise().query(
            `SELECT ${role.id}
             FROM ${role.table}
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        if (accounts.length) {
            return res.status(409).json({
                error: "An account already exists for this email."
            });
        }

        await saveOtp(email, roleName, "registration");

        return res.json({
            success: true,
            message: "If the email can be registered, an OTP has been sent."
        });
    } catch (error) {
        console.error("REGISTRATION OTP ERROR:", error);
        return res.status(500).json({
            error: "Could not send OTP. Check your Gmail configuration."
        });
    }
});


router.post("/registration/verify-otp", async (req, res) => {
    const roleName = String(req.body.role || "").toLowerCase();
    const role = getRole(roleName);
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!role || !isValidEmail(email) || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            error: "Enter the account type, valid email, and six-digit OTP."
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT otp_id, otp_hash, attempts
             FROM AuthOTP
             WHERE email = ? AND role = ? AND purpose = 'registration'
               AND expires_at > NOW() AND verified_at IS NULL
             LIMIT 1`,
            [email, roleName]
        );

        if (!rows.length || Number(rows[0].attempts) >= 5) {
            return res.status(400).json({
                error: "OTP is invalid or expired. Request a new one."
            });
        }

        const record = rows[0];

        if (hashToken(otp) !== record.otp_hash) {
            await db.promise().query(
                "UPDATE AuthOTP SET attempts = attempts + 1 WHERE otp_id = ?",
                [record.otp_id]
            );

            return res.status(400).json({
                error: "Incorrect OTP."
            });
        }

        const verificationToken = createToken();

        await db.promise().query(
            `UPDATE AuthOTP
             SET verified_at = NOW(),
                 verification_token_hash = ?,
                 expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
             WHERE otp_id = ?`,
            [hashToken(verificationToken), record.otp_id]
        );

        return res.json({
            success: true,
            verificationToken,
            message: "Email verified. Continue creating your account."
        });
    } catch (error) {
        console.error("REGISTRATION OTP VERIFICATION ERROR:", error);
        return res.status(500).json({
            error: "Could not verify OTP."
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
        const [accounts] = await db.promise().query(
            `SELECT ${role.id}
             FROM ${role.table}
             WHERE LOWER(email) = ? AND email_verified = 1
             LIMIT 1`,
            [email]
        );

        // Keep the response generic to avoid revealing account existence.
        if (accounts.length) {
            await saveOtp(email, roleName, "password_reset");
        }

        return res.json({
            success: true,
            message: "If a verified account exists, a reset OTP has been sent."
        });
    } catch (error) {
        console.error("FORGOT PASSWORD OTP ERROR:", error);
        return res.status(500).json({
            error: "Could not send reset OTP. Check Gmail configuration."
        });
    }
});

// POST /api/auth/verify-reset-otp
// Body: { role, email, otp }
router.post("/verify-reset-otp", async (req, res) => {
    const roleName = String(req.body.role || "").toLowerCase();
    const role = getRole(roleName);
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!role || !isValidEmail(email) || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            error: "Enter the account type, valid email, and six-digit OTP."
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT otp_id, otp_hash, attempts
             FROM AuthOTP
             WHERE email = ? AND role = ? AND purpose = 'password_reset'
               AND expires_at > NOW() AND verified_at IS NULL
             LIMIT 1`,
            [email, roleName]
        );

        if (!rows.length || Number(rows[0].attempts) >= 5) {
            return res.status(400).json({
                error: "OTP is invalid or expired. Request a new one."
            });
        }

        const record = rows[0];

        if (hashToken(otp) !== record.otp_hash) {
            await db.promise().query(
                "UPDATE AuthOTP SET attempts = attempts + 1 WHERE otp_id = ?",
                [record.otp_id]
            );

            return res.status(400).json({
                error: "Incorrect OTP."
            });
        }

        const resetToken = createToken();

        await db.promise().query(
            `UPDATE AuthOTP
             SET verified_at = NOW(),
                 verification_token_hash = ?,
                 expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
             WHERE otp_id = ?`,
            [hashToken(resetToken), record.otp_id]
        );

        return res.json({
            success: true,
            resetToken,
            message: "OTP verified. You can now set a new password."
        });
    } catch (error) {
        console.error("RESET OTP VERIFICATION ERROR:", error);
        return res.status(500).json({
            error: "Could not verify reset OTP."
        });
    }
});

// POST /api/auth/reset-password
// Body: { role, email, resetToken, password }
router.post("/reset-password", async (req, res) => {
    const roleName = String(req.body.role || "").toLowerCase();
    const role = getRole(roleName);
    const email = normalizeEmail(req.body.email);
    const resetToken = String(req.body.resetToken || "");
    const password = req.body.password;

    if (!role || !isValidEmail(email) || !/^[a-f0-9]{64}$/i.test(resetToken)) {
        return res.status(400).json({
            error: "Invalid password-reset details."
        });
    }

    if (!validPassword(password)) {
        return res.status(400).json({
            error: "Password must be between 8 and 128 characters."
        });
    }

    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT otp_id
             FROM AuthOTP
             WHERE email = ? AND role = ? AND purpose = 'password_reset'
               AND verification_token_hash = ?
               AND verified_at IS NOT NULL AND expires_at > NOW()
             LIMIT 1
             FOR UPDATE`,
            [email, roleName, hashToken(resetToken)]
        );

        if (!rows.length) {
            await connection.rollback();
            return res.status(400).json({
                error: "Reset verification is invalid, expired, or already used."
            });
        }

        const [accounts] = await connection.query(
            `SELECT ${role.id}
             FROM ${role.table}
             WHERE LOWER(email) = ? AND email_verified = 1
             LIMIT 1
             FOR UPDATE`,
            [email]
        );

        if (!accounts.length) {
            await connection.rollback();
            return res.status(400).json({
                error: "Verified account not found."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await connection.query(
            `UPDATE ${role.table} SET password = ? WHERE ${role.id} = ?`,
            [passwordHash, accounts[0][role.id]]
        );

        await connection.query(
            "DELETE FROM AuthOTP WHERE otp_id = ?",
            [rows[0].otp_id]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Password reset successfully. You can now log in."
        });
    } catch (error) {
        await connection.rollback();
        console.error("RESET PASSWORD ERROR:", error);
        return res.status(500).json({
            error: "Could not reset password."
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
