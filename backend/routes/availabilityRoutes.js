const express = require("express");

const router = express.Router();

const db = require("../db");


// ----------------------------------
// Add Availability Slot
// ----------------------------------

router.post("/", (req, res) => {

    const {
        tutor_id,
        start_time,
        end_time
    } = req.body;


    // Check required fields

    if (!tutor_id || !start_time || !end_time) {

        return res.status(400).json({
            error: "tutor_id, start_time and end_time are required"
        });

    }


    // Insert availability slot

    const sql = `
        INSERT INTO Availability_Slot
        (tutor_id, start_time, end_time, status)
        VALUES (?, ?, ?, 'AVAILABLE')
    `;


    db.query(
        sql,
        [
            tutor_id,
            start_time,
            end_time
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Failed to create availability slot"
                });

            }


            res.status(201).json({

                message: "Availability slot created successfully",

                slot_id: result.insertId,

                tutor_id: tutor_id,

                start_time: start_time,

                end_time: end_time,

                status: "AVAILABLE"

            });

        }
    );

});


module.exports = router;