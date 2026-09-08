const express = require("express");
const db = require("../db");

const router = express.Router();


// =====================================================
// ADD AVAILABILITY SLOT
// =====================================================

router.post("/", (req, res) => {

    const {
        tutor_id,
        start_time,
        end_time
    } = req.body;


    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!tutor_id || !start_time || !end_time) {

        return res.status(400).json({
            error:
                "tutor_id, start_time and end_time are required"
        });

    }


    // -----------------------------------------
    // Validate time
    // -----------------------------------------

    const start = new Date(start_time);
    const end = new Date(end_time);


    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {

        return res.status(400).json({
            error: "Invalid date or time"
        });

    }


    if (end <= start) {

        return res.status(400).json({
            error:
                "End time must be after start time"
        });

    }


    // -----------------------------------------
    // Check overlapping slots
    // -----------------------------------------

    const overlapSQL = `
        SELECT slot_id
        FROM Availability_Slot
        WHERE tutor_id = ?
        AND status = 'AVAILABLE'
        AND start_time < ?
        AND end_time > ?
    `;


    db.query(
        overlapSQL,
        [
            tutor_id,
            end_time,
            start_time
        ],
        (overlapErr, overlapResults) => {

            if (overlapErr) {

                console.error(
                    "AVAILABILITY OVERLAP ERROR:",
                    overlapErr
                );

                return res.status(500).json({
                    error:
                        "Failed to check availability"
                });

            }


            if (overlapResults.length > 0) {

                return res.status(409).json({
                    error:
                        "This time overlaps with an existing availability slot"
                });

            }


            // -----------------------------------------
            // Insert Slot
            // -----------------------------------------

            const insertSQL = `
                INSERT INTO Availability_Slot
                (
                    tutor_id,
                    start_time,
                    end_time,
                    status
                )
                VALUES (?, ?, ?, 'AVAILABLE')
            `;


            db.query(
                insertSQL,
                [
                    tutor_id,
                    start_time,
                    end_time
                ],
                (insertErr, result) => {

                    if (insertErr) {

                        console.error(
                            "AVAILABILITY CREATE ERROR:",
                            insertErr
                        );

                        return res.status(500).json({
                            error:
                                "Failed to create availability slot"
                        });

                    }


                    res.status(201).json({

                        message:
                            "Availability slot added successfully",

                        slot: {

                            slot_id:
                                result.insertId,

                            tutor_id:
                                Number(tutor_id),

                            start_time,

                            end_time,

                            status:
                                "AVAILABLE"

                        }

                    });

                }
            );

        }
    );

});


// =====================================================
// GET TUTOR AVAILABILITY
// =====================================================

router.get("/tutor/:tutorId", (req, res) => {

    const tutorId =
        req.params.tutorId;


    const sql = `
        SELECT
            slot_id,
            tutor_id,
            start_time,
            end_time,
            status
        FROM Availability_Slot
        WHERE tutor_id = ?
        ORDER BY start_time ASC
    `;


    db.query(
        sql,
        [tutorId],
        (err, results) => {

            if (err) {

                console.error(
                    "AVAILABILITY FETCH ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to fetch availability"
                });

            }


            res.json({
                slots: results
            });

        }
    );

});


// =====================================================
// DELETE AVAILABILITY SLOT
// =====================================================

router.delete("/:slotId", (req, res) => {

    const slotId =
        req.params.slotId;

    const tutorId =
        req.query.tutor_id;


    if (!tutorId) {

        return res.status(400).json({
            error:
                "tutor_id is required"
        });

    }


    const sql = `
        DELETE FROM Availability_Slot
        WHERE slot_id = ?
        AND tutor_id = ?
        AND status = 'AVAILABLE'
    `;


    db.query(
        sql,
        [
            slotId,
            tutorId
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "AVAILABILITY DELETE ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to delete availability slot"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        "Available slot not found"
                });

            }


            res.json({

                message:
                    "Availability slot deleted successfully"

            });

        }
    );

});


module.exports = router;