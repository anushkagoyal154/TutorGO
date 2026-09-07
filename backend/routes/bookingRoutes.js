const express = require("express");

const router = express.Router();

const db = require("../db");


// Book a tutor
router.post("/", (req, res) => {

    const {
        request_id,
        student_id,
        tutor_id,
        slot_id
    } = req.body;


    // Check required data
    if (!request_id || !student_id || !tutor_id || !slot_id) {

        return res.status(400).json({
            error: "request_id, student_id, tutor_id and slot_id are required"
        });

    }


    // Start SQL transaction
    db.beginTransaction((err) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Could not start transaction"
            });

        }


        // Lock the selected slot
        const checkSlotSQL = `
            SELECT *
            FROM Availability_Slot
            WHERE slot_id = ?
            AND tutor_id = ?
            FOR UPDATE
        `;


        db.query(
            checkSlotSQL,
            [slot_id, tutor_id],
            (err, slotResults) => {

                if (err) {

                    return db.rollback(() => {

                        console.error(err);

                        res.status(500).json({
                            error: "Failed to check availability"
                        });

                    });

                }


                // Slot doesn't exist
                if (slotResults.length === 0) {

                    return db.rollback(() => {

                        res.status(404).json({
                            error: "Slot not found"
                        });

                    });

                }


                const slot = slotResults[0];


                // Slot already booked
                if (slot.status !== "AVAILABLE") {

                    return db.rollback(() => {

                        res.status(409).json({
                            error: "This slot is no longer available"
                        });

                    });

                }


                // Create booking
                const bookingSQL = `
                    INSERT INTO Booking
                    (
                        request_id,
                        student_id,
                        tutor_id,
                        slot_id,
                        booking_status
                    )
                    VALUES (?, ?, ?, ?, 'CONFIRMED')
                `;


                db.query(
                    bookingSQL,
                    [
                        request_id,
                        student_id,
                        tutor_id,
                        slot_id
                    ],
                    (err, bookingResult) => {

                        if (err) {

                            return db.rollback(() => {

                                console.error(err);

                                res.status(500).json({
                                    error: "Failed to create booking"
                                });

                            });

                        }


                        // Mark slot as booked
                        const updateSlotSQL = `
                            UPDATE Availability_Slot
                            SET status = 'BOOKED'
                            WHERE slot_id = ?
                        `;


                        db.query(
                            updateSlotSQL,
                            [slot_id],
                            (err) => {

                                if (err) {

                                    return db.rollback(() => {

                                        console.error(err);

                                        res.status(500).json({
                                            error: "Failed to update slot"
                                        });

                                    });

                                }


                                // Everything successful
                                db.commit((err) => {

                                    if (err) {

                                        return db.rollback(() => {

                                            console.error(err);

                                            res.status(500).json({
                                                error: "Failed to commit booking"
                                            });

                                        });

                                    }


                                    res.status(201).json({

                                        message: "Tutor booked successfully",

                                        booking_id:
                                            bookingResult.insertId,

                                        request_id:
                                            request_id,

                                        student_id:
                                            student_id,

                                        tutor_id:
                                            tutor_id,

                                        slot_id:
                                            slot_id,

                                        booking_status:
                                            "CONFIRMED",

                                        slot_status:
                                            "BOOKED"

                                    });

                                });

                            }

                        );

                    }

                );

            }

        );

    });

});


module.exports = router;