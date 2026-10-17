
const express = require("express");
const router = express.Router();

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");


const {
    normalizeEmail,
    isValidEmail
} = require("../services/emailAuthService");

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

// =========================================
// CREATE TUTOR ACCOUNT
// =========================================

// POST /api/tutors
// Requires a verified registration token
// =========================================

router.post("/", async (req, res) => {
    const name =
        typeof req.body.name === "string"
            ? req.body.name.trim()
            : "";

    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    const qualification =
        typeof req.body.qualification === "string"
            ? req.body.qualification.trim()
            : "";

    const experience = Number(req.body.experience);
    const price = Number(req.body.price_per_session);

    const location =
        typeof req.body.location === "string"
            ? req.body.location.trim()
            : "";

    const verificationToken =
        typeof req.body.verificationToken === "string"
            ? req.body.verificationToken.trim()
            : "";

    if (
        !name ||
        !isValidEmail(email) ||
        !qualification ||
        req.body.experience === undefined ||
        req.body.price_per_session === undefined ||
        !location
    ) {
        return res.status(400).json({
            success: false,
            error: "Name, valid email, qualification, experience, price and location are required."
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

    if (
        !Number.isFinite(experience) ||
        experience < 0 ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        return res.status(400).json({
            success: false,
            error: "Experience and price must be valid non-negative numbers."
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
               AND role = 'tutor'
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
            `INSERT INTO Tutor
                (
                    name,
                    email,
                    password,
                    email_verified,
                    qualification,
                    experience,
                    price_per_session,
                    rating,
                    location
                )
             VALUES (?, ?, ?, 1, ?, ?, ?, 0, ?)`,
            [
                name,
                email,
                passwordHash,
                qualification,
                experience,
                price,
                location
            ]
        );

        await connection.query(
            "DELETE FROM AuthOTP WHERE otp_id = ?",
            [verificationRows[0].otp_id]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Tutor account created successfully.",
            tutor_id: result.insertId
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

        console.error("TUTOR REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to create tutor account."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// =========================================
// TUTOR LOGIN
// POST /api/tutors/login
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
            `SELECT
                tutor_id,
                name,
                email,
                password,
                email_verified,
                qualification,
                experience,
                price_per_session,
                rating,
                location,
                resume_path
             FROM Tutor
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

        const tutor = rows[0];

        if (Number(tutor.email_verified) !== 1) {
            return res.status(403).json({
                success: false,
                error: "Please verify your email before logging in."
            });
        }

        if (
            !tutor.password ||
            !(await bcrypt.compare(password, tutor.password))
        ) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password."
            });
        }

        const [expertiseRows] = await db.promise().query(
            `SELECT
                s.subject_id,
                s.subject_name,
                s.topic,
                te.expertise_level
             FROM Tutor_Expertise te
             JOIN Subject s ON te.subject_id = s.subject_id
             WHERE te.tutor_id = ?
             ORDER BY s.subject_name`,
            [tutor.tutor_id]
        );

        const subjects = expertiseRows.map(
            (item) => item.subject_name
        );

        const expertise = {};

        expertiseRows.forEach((item) => {
            expertise[item.subject_name] = item.expertise_level;
        });

        const {
            password: storedPassword,
            ...safeTutor
        } = tutor;

        const token = jwt.sign(
            {
                id: tutor.tutor_id,
                role: "tutor",
                email: tutor.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({
            success: true,
            message: "Tutor login successful.",
            token,
            tutor: {
                ...safeTutor,
                subjects,
                expertise,
                expertise_details: expertiseRows
            }
        });
    } catch (error) {
        console.error("TUTOR LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Tutor login failed."
        });
    }
});

// =========================================
// GET TUTOR PROFILE BY EMAIL
// GET /api/tutors/profile?email=...
//
// Legacy profile lookup. Protect private data
// with JWT authorization before production.
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
        const [tutorRows] = await db.promise().query(
            `SELECT
                tutor_id,
                name,
                email,
                qualification,
                experience,
                price_per_session,
                rating,
                location,
                resume_path
             FROM Tutor
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        if (!tutorRows.length) {
            return res.status(404).json({
                success: false,
                error: "Tutor profile not found."
            });
        }

        const tutor = tutorRows[0];

        const [expertiseRows] = await db.promise().query(
            `SELECT
                s.subject_id,
                s.subject_name,
                s.topic,
                te.expertise_level
             FROM Tutor_Expertise te
             JOIN Subject s ON te.subject_id = s.subject_id
             WHERE te.tutor_id = ?
             ORDER BY s.subject_name`,
            [tutor.tutor_id]
        );

        const subjects = expertiseRows.map(
            (item) => item.subject_name
        );

        const expertise = {};

        expertiseRows.forEach((item) => {
            expertise[item.subject_name] = item.expertise_level;
        });

        return res.json({
            success: true,
            tutor: {
                ...tutor,
                subjects,
                expertise,
                expertise_details: expertiseRows
            }
        });
    } catch (error) {
        console.error("TUTOR PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch tutor profile."
        });
    }
});

// =========================================
// UPDATE TUTOR PROFILE
// PUT /api/tutors/:tutorId
// =========================================

router.put("/:tutorId", async (req, res) => {
    const tutorId = Number(req.params.tutorId);

    const name =
        typeof req.body.name === "string"
            ? req.body.name.trim()
            : "";

    const email = normalizeEmail(req.body.email);

    const qualification =
        typeof req.body.qualification === "string"
            ? req.body.qualification.trim()
            : "";

    const experience = Number(req.body.experience);
    const price = Number(req.body.price_per_session);

    const location =
        typeof req.body.location === "string"
            ? req.body.location.trim()
            : "";

    if (!Number.isInteger(tutorId) || tutorId <= 0) {
        return res.status(400).json({
            success: false,
            error: "Invalid tutor ID."
        });
    }

    if (
        !name ||
        !isValidEmail(email) ||
        !qualification ||
        req.body.experience === undefined ||
        req.body.price_per_session === undefined ||
        !location
    ) {
        return res.status(400).json({
            success: false,
            error: "Name, valid email, qualification, experience, price and location are required."
        });
    }

    if (
        !Number.isFinite(experience) ||
        experience < 0 ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        return res.status(400).json({
            success: false,
            error: "Experience and price must be valid non-negative numbers."
        });
    }

    try {
        const [result] = await db.promise().query(
            `UPDATE Tutor
             SET
                name = ?,
                email = ?,
                qualification = ?,
                experience = ?,
                price_per_session = ?,
                location = ?
             WHERE tutor_id = ?`,
            [
                name,
                email,
                qualification,
                experience,
                price,
                location,
                tutorId
            ]
        );

        if (!result.affectedRows) {
            const [existing] = await db.promise().query(
                "SELECT tutor_id FROM Tutor WHERE tutor_id = ? LIMIT 1",
                [tutorId]
            );

            if (!existing.length) {
                return res.status(404).json({
                    success: false,
                    error: "Tutor not found."
                });
            }
        }

        return res.json({
            success: true,
            message: "Tutor profile updated successfully.",
            tutor: {
                tutor_id: tutorId,
                name,
                email,
                qualification,
                experience,
                price_per_session: price,
                location
            }
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                error: "This email is already used by another account."
            });
        }

        console.error("TUTOR UPDATE ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to update tutor profile."
        });
    }
});


module.exports = router;