
const express = require("express");
const router = express.Router();

const crypto = require("crypto");
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
    normalizeEmail,
    isValidEmail
} = require("../services/emailAuthService");

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

// =========================================
// CREATE STUDENT ACCOUNT
// POST /api/students
// Requires a verified registration token
// =========================================

router.post("/", async (req, res) => {
    const name =
        typeof req.body.name === "string"
            ? req.body.name.trim()
            : "";

    const email = normalizeEmail(req.body.email);

    const password = req.body.password;

    const educationLevel =
        typeof req.body.education_level === "string"
            ? req.body.education_level.trim()
            : "";

    const verificationToken =
        typeof req.body.verificationToken === "string"
            ? req.body.verificationToken.trim()
            : "";

    if (!name || !isValidEmail(email) || !educationLevel) {
        return res.status(400).json({
            success: false,
            error: "Name, valid email and education level are required."
        });
    }

    if (
        typeof password !== "string" ||
        password.length < PASSWORD_MIN_LENGTH ||
        password.length > PASSWORD_MAX_LENGTH
    ) {
        return res.status(400).json({
            success: false,
            error: "Password must be between 8 and 128 characters."
        });
    }

    if (!/^[a-f0-9]{64}$/i.test(verificationToken)) {
        return res.status(400).json({
            success: false,
            error: "A valid email verification token is required."
        });
    }

    let connection;

    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const tokenHash = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

        const [verificationRows] = await connection.query(
            `SELECT otp_id
             FROM AuthOTP
             WHERE email = ?
               AND role = 'student'
               AND purpose = 'registration'
               AND verification_token_hash = ?
               AND verified_at IS NOT NULL
               AND expires_at > NOW()
             LIMIT 1
             FOR UPDATE`,
            [email, tokenHash]
        );

        if (!verificationRows.length) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                error: "Verification token is invalid, expired, or already used. Verify your email again."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await connection.query(
            `INSERT INTO Student
                (name, email, password, email_verified, education_level)
             VALUES (?, ?, ?, 1, ?)`,
            [name, email, passwordHash, educationLevel]
        );

        // Consume the token atomically with account creation.
        await connection.query(
            "DELETE FROM AuthOTP WHERE otp_id = ?",
            [verificationRows[0].otp_id]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Student account created successfully.",
            student: {
                student_id: result.insertId,
                name,
                email,
                education_level: educationLevel
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                error: "An account with this email already exists."
            });
        }

        console.error("STUDENT REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to create student account."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// =========================================
// STUDENT LOGIN
// POST /api/students/login
// =========================================

router.post("/login", async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (
        !isValidEmail(email) ||
        typeof password !== "string" ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            error: "Enter a valid email and password."
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured.");

        return res.status(500).json({
            success: false,
            error: "Authentication is not configured."
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT student_id, name, email, education_level,
                    password, email_verified
             FROM Student
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password."
            });
        }

        const student = rows[0];

        if (Number(student.email_verified) !== 1) {
            return res.status(403).json({
                success: false,
                error: "Please verify your email before logging in."
            });
        }

        if (!student.password) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            student.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                id: student.student_id,
                role: "student",
                email: student.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({
            success: true,
            message: "Student login successful.",
            token,
            student: {
                student_id: student.student_id,
                name: student.name,
                email: student.email,
                education_level: student.education_level
            }
        });
    } catch (error) {
        console.error("STUDENT LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Student login failed."
        });
    }
});

// =========================================
// GET STUDENT PROFILE
// GET /api/students/profile?email=...
// Legacy endpoint; use JWT authorization
// before exposing private profile data.
// =========================================

router.get("/profile", async (req, res) => {
    const email = normalizeEmail(req.query.email);

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            error: "A valid email is required."
        });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT student_id, name, email, education_level
             FROM Student
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                error: "Student profile not found."
            });
        }

        return res.json({
            success: true,
            student: rows[0]
        });
    } catch (error) {
        console.error("STUDENT PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch student profile."
        });
    }
});

// =========================================
// UPDATE STUDENT PROFILE
// PUT /api/students/:studentId
// =========================================

router.put("/:studentId", async (req, res) => {
    const studentId = Number(req.params.studentId);

    const name =
        typeof req.body.name === "string"
            ? req.body.name.trim()
            : "";

    const email = normalizeEmail(req.body.email);

    const educationLevel =
        typeof req.body.education_level === "string"
            ? req.body.education_level.trim()
            : "";

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            error: "Invalid student ID."
        });
    }

    if (!name || !isValidEmail(email) || !educationLevel) {
        return res.status(400).json({
            success: false,
            error: "Name, valid email and education level are required."
        });
    }

    try {
        const [result] = await db.promise().query(
            `UPDATE Student
             SET name = ?, email = ?, education_level = ?
             WHERE student_id = ?`,
            [name, email, educationLevel, studentId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                error: "Student not found or no profile changes were made."
            });
        }

        return res.json({
            success: true,
            message: "Student profile updated successfully.",
            student: {
                student_id: studentId,
                name,
                email,
                education_level: educationLevel
            }
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                error: "This email is already used by another account."
            });
        }

        console.error("STUDENT UPDATE ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to update student profile."
        });
    }
});

module.exports = router;
