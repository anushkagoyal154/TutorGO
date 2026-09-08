const express = require("express");
const router = express.Router();

const db = require("../db");


// =========================================
// CREATE TUTOR
// =========================================

router.post("/", (req, res) => {

    const {
        name,
        email,
        qualification,
        experience,
        price_per_session,
        location
    } = req.body;


    const sql = `
        INSERT INTO Tutor
        (
            name,
            email,
            qualification,
            experience,
            price_per_session,
            rating,
            location
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [
        name,
        email,
        qualification,
        experience,
        price_per_session,
        0,
        location
    ];


    db.query(sql, values, (err, result) => {

        if (err) {

            console.error("TUTOR CREATE ERROR:", err);

            return res.status(500).json({
                error: "Failed to create tutor"
            });

        }


        res.status(201).json({

            message: "Tutor created successfully",

            tutor_id: result.insertId

        });

    });

});



// =========================================
// GET TUTOR PROFILE BY EMAIL
// =========================================

router.get("/profile", (req, res) => {

    const { email } = req.query;


    if (!email) {

        return res.status(400).json({
            error: "Email is required"
        });

    }


    // -----------------------------------------
    // Get Tutor basic profile
    // -----------------------------------------

    const tutorSQL = `
        SELECT
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
        WHERE email = ?
    `;


    db.query(tutorSQL, [email], (err, tutorResults) => {

        if (err) {

            console.error(
                "TUTOR PROFILE ERROR:",
                err
            );

            return res.status(500).json({
                error: "Failed to fetch tutor profile"
            });

        }


        if (tutorResults.length === 0) {

            return res.status(404).json({
                error: "Tutor profile not found"
            });

        }


        const tutor = tutorResults[0];


        // -----------------------------------------
        // Get Tutor Expertise + Subjects
        // -----------------------------------------

        const expertiseSQL = `
            SELECT
                s.subject_id,
                s.subject_name,
                s.topic,
                te.expertise_level
            FROM Tutor_Expertise te
            JOIN Subject s
                ON te.subject_id = s.subject_id
            WHERE te.tutor_id = ?
            ORDER BY s.subject_name
        `;


        db.query(
            expertiseSQL,
            [tutor.tutor_id],
            (expertiseErr, expertiseResults) => {

                if (expertiseErr) {

                    console.error(
                        "TUTOR EXPERTISE ERROR:",
                        expertiseErr
                    );

                    return res.status(500).json({
                        error:
                            "Failed to fetch tutor expertise"
                    });

                }


                // -----------------------------------------
                // Prepare subjects
                // -----------------------------------------

                const subjects =
                    expertiseResults.map(
                        (item) => item.subject_name
                    );


                // -----------------------------------------
                // Prepare expertise object
                // -----------------------------------------

                const expertise = {};


                expertiseResults.forEach((item) => {

                    expertise[item.subject_name] =
                        item.expertise_level;

                });


                // -----------------------------------------
                // Final response
                // -----------------------------------------

                res.json({

                    tutor: {

                        ...tutor,

                        subjects: subjects,

                        expertise: expertise,

                        expertise_details:
                            expertiseResults

                    }

                });

            }
        );

    });

});


module.exports = router;