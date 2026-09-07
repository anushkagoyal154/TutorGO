const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const parseResume = require("../parser/resumeParser");
const db=require("../db");
const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/resumes/");
    },

    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage: storage,

    fileFilter: function (req, file, cb) {

        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    }
});

router.post("/", upload.single("resume"), async (req, res) => {

    try {

        // -------------------------
        // Check uploaded file
        // -------------------------

        if (!req.file) {

            return res.status(400).json({
                error: "Please upload a PDF resume"
            });

        }


        // -------------------------
        // Check tutor ID
        // -------------------------

        const tutorId = req.body.tutor_id;

        if (!tutorId) {

            return res.status(400).json({
                error: "tutor_id is required"
            });

        }


        // -------------------------
        // Read PDF
        // -------------------------

        const dataBuffer = fs.readFileSync(req.file.path);


        // -------------------------
        // Extract PDF text
        // -------------------------

        const data = await pdfParse(dataBuffer);


        // -------------------------
        // Parse Resume
        // -------------------------

        const parsedData = parseResume(data.text);


        // -------------------------
        // Update Tutor table
        // -------------------------

        const updateTutorSQL = `
            UPDATE Tutor
            SET
                name = ?,
                qualification = ?,
                experience = ?,
                resume_path = ?
            WHERE tutor_id = ?
        `;

        await new Promise((resolve, reject) => {

            db.query(
                updateTutorSQL,
                [
                    parsedData.name,
                    parsedData.qualification,
                    parsedData.experience,
                    req.file.path,
                    tutorId
                ],
                (err, result) => {

                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }

                }
            );

        });


        // -------------------------
        // Insert Tutor Expertise
        // -------------------------

        for (const subject of parsedData.subjects) {

            const expertiseLevel =
                parsedData.expertise[subject] || "Intermediate";


            // Find subject ID
            const subjectId = await new Promise((resolve, reject) => {

                const sql = `
                    SELECT subject_id
                    FROM Subject
                    WHERE LOWER(subject_name) = LOWER(?)
                `;

                db.query(
                    sql,
                    [subject],
                    (err, results) => {

                        if (err) {
                            reject(err);
                            return;
                        }

                        if (results.length === 0) {
                            resolve(null);
                            return;
                        }

                        resolve(results[0].subject_id);

                    }
                );

            });


            // If subject doesn't exist, skip it
            if (!subjectId) {
                continue;
            }


            // Insert expertise
            await new Promise((resolve, reject) => {

                const sql = `
                    INSERT INTO Tutor_Expertise
                    (tutor_id, subject_id, expertise_level)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    expertise_level = VALUES(expertise_level)
                `;

                db.query(
                    sql,
                    [tutorId, subjectId, expertiseLevel],
                    (err) => {

                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }

                    }
                );

            });

        }


        // -------------------------
        // Send Response
        // -------------------------

        res.json({

            message: "Resume uploaded and tutor profile updated successfully",

            tutor_id: tutorId,

            file: req.file.filename,

            resume_path: req.file.path,

            parsed_data: parsedData

        });

    }

    catch (error) {

        console.error("RESUME ERROR:", error);

        res.status(500).json({

            error: "Failed to process resume",

            details: error.message

        });

    }

});

module.exports = router;