const express = require("express");
const db = require("../db");

const router = express.Router();


// ----------------------------------
// Create Coaching Request
// ----------------------------------

router.post("/", (req, res) => {

    const {
        student_id,
        subject_id,
        topic,
        preferred_time,
        budget,
        mode
    } = req.body;


    // Check required fields

    if (!student_id || !subject_id || !topic || !preferred_time) {

        return res.status(400).json({
            error: "student_id, subject_id, topic and preferred_time are required"
        });

    }


    // Insert request

    const sql = `
        INSERT INTO Coaching_Request
        (
            student_id,
            subject_id,
            topic,
            preferred_time,
            budget,
            mode,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `;


    db.query(
        sql,
        [
            student_id,
            subject_id,
            topic,
            preferred_time,
            budget || null,
            mode || "Online"
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Failed to create coaching request",
                    details: err.message
                });

            }


            res.status(201).json({

                message: "Coaching request created successfully",

                request_id: result.insertId,

                student_id: student_id,

                subject_id: subject_id,

                topic: topic,

                preferred_time: preferred_time,

                budget: budget || null,

                mode: mode || "Online",

                status: "PENDING"

            });

        }
    );

});


module.exports = router;