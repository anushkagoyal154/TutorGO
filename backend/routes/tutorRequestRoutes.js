const express = require("express");
const db = require("../db");

const router = express.Router();


// ==================================
// ACCEPT TUTORING REQUEST
// ==================================

router.post("/:requestId/accept", (req, res) => {

    const requestId = req.params.requestId;
    const { tutor_id } = req.body;


    if (!tutor_id) {

        return res.status(400).json({
            error: "tutor_id is required"
        });

    }


    // ----------------------------------
    // Start Transaction
    // ----------------------------------

    db.beginTransaction((err) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Could not start transaction"
            });

        }


        // ----------------------------------
        // Check Booking
        // ----------------------------------

        const bookingSQL = `
            SELECT *
            FROM Booking
            WHERE request_id = ?
            AND tutor_id = ?
            AND booking_status = 'CONFIRMED'
            FOR UPDATE
        `;


        db.query(
            bookingSQL,
            [requestId, tutor_id],
            (err, bookingResults) => {

                if (err) {

                    return db.rollback(() => {

                        console.error(err);

                        res.status(500).json({
                            error: "Failed to find booking"
                        });

                    });

                }


                if (bookingResults.length === 0) {

                    return db.rollback(() => {

                        res.status(404).json({
                            error: "Booking not found"
                        });

                    });

                }


                // ----------------------------------
                // Update Coaching Request
                // ----------------------------------

                const updateRequestSQL = `
                    UPDATE Coaching_Request
                    SET status = 'ACCEPTED'
                    WHERE request_id = ?
                `;


                db.query(
                    updateRequestSQL,
                    [requestId],
                    (err) => {

                        if (err) {

                            return db.rollback(() => {

                                console.error(err);

                                res.status(500).json({
                                    error: "Failed to accept request"
                                });

                            });

                        }


                        // ----------------------------------
                        // Commit Transaction
                        // ----------------------------------

                        db.commit((err) => {

                            if (err) {

                                return db.rollback(() => {

                                    console.error(err);

                                    res.status(500).json({
                                        error: "Failed to commit acceptance"
                                    });

                                });

                            }


                            res.json({

                                message:
                                    "Tutoring request accepted",

                                request_id:
                                    Number(requestId),

                                tutor_id:
                                    Number(tutor_id),

                                booking_id:
                                    bookingResults[0].booking_id,

                                booking_status:
                                    "CONFIRMED",

                                request_status:
                                    "ACCEPTED"

                            });

                        });

                    }

                );

            }

        );

    });

});



// ==================================
// REJECT TUTORING REQUEST
// ==================================

router.post("/:requestId/reject", (req, res) => {

    const requestId = req.params.requestId;
    const { tutor_id } = req.body;


    if (!tutor_id) {

        return res.status(400).json({
            error: "tutor_id is required"
        });

    }


    // ----------------------------------
    // Start Transaction
    // ----------------------------------

    db.beginTransaction((err) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Could not start transaction"
            });

        }


        // ----------------------------------
        // Find Booking
        // ----------------------------------

        const bookingSQL = `
            SELECT *
            FROM Booking
            WHERE request_id = ?
            AND tutor_id = ?
            AND booking_status = 'CONFIRMED'
            FOR UPDATE
        `;


        db.query(
            bookingSQL,
            [requestId, tutor_id],
            (err, bookingResults) => {

                if (err) {

                    return db.rollback(() => {

                        console.error(err);

                        res.status(500).json({
                            error: "Failed to find booking"
                        });

                    });

                }


                if (bookingResults.length === 0) {

                    return db.rollback(() => {

                        res.status(404).json({
                            error: "Booking not found"
                        });

                    });

                }


                const booking =
                    bookingResults[0];


                // ----------------------------------
                // Cancel Booking
                // ----------------------------------

                const cancelBookingSQL = `
                    UPDATE Booking
                    SET booking_status = 'CANCELLED'
                    WHERE booking_id = ?
                `;


                db.query(
                    cancelBookingSQL,
                    [booking.booking_id],
                    (err) => {

                        if (err) {

                            return db.rollback(() => {

                                console.error(err);

                                res.status(500).json({
                                    error: "Failed to cancel booking"
                                });

                            });

                        }


                        // ----------------------------------
                        // Make Slot Available Again
                        // ----------------------------------

                        const updateSlotSQL = `
                            UPDATE Availability_Slot
                            SET status = 'AVAILABLE'
                            WHERE slot_id = ?
                        `;


                        db.query(
                            updateSlotSQL,
                            [booking.slot_id],
                            (err) => {

                                if (err) {

                                    return db.rollback(() => {

                                        console.error(err);

                                        res.status(500).json({
                                            error:
                                                "Failed to release slot"
                                        });

                                    });

                                }


                                // ----------------------------------
                                // Update Request
                                // ----------------------------------

                                const updateRequestSQL = `
                                    UPDATE Coaching_Request
                                    SET status = 'REJECTED'
                                    WHERE request_id = ?
                                `;


                                db.query(
                                    updateRequestSQL,
                                    [requestId],
                                    (err) => {

                                        if (err) {

                                            return db.rollback(() => {

                                                console.error(err);

                                                res.status(500).json({
                                                    error:
                                                        "Failed to reject request"
                                                });

                                            });

                                        }


                                        // ----------------------------------
                                        // Commit
                                        // ----------------------------------

                                        db.commit((err) => {

                                            if (err) {

                                                return db.rollback(() => {

                                                    console.error(err);

                                                    res.status(500).json({
                                                        error:
                                                            "Failed to commit rejection"
                                                    });

                                                });

                                            }


                                            res.json({

                                                message:
                                                    "Tutoring request rejected",

                                                request_id:
                                                    Number(requestId),

                                                tutor_id:
                                                    Number(tutor_id),

                                                booking_id:
                                                    booking.booking_id,

                                                booking_status:
                                                    "CANCELLED",

                                                slot_status:
                                                    "AVAILABLE",

                                                request_status:
                                                    "REJECTED"

                                            });

                                        });

                                    }

                                );

                            }

                        );

                    }

                );

            }

        );

    });

});


module.exports = router;