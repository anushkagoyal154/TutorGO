const express = require("express");
const router = express.Router();

const db = require("../db");


// =========================================
// SELECT / REQUEST A TUTOR
// =========================================

router.post("/:requestId/select", (req, res) => {

    const requestId = req.params.requestId;

    const {
        student_id,
        tutor_id,
        slot_id
    } = req.body;


    // -----------------------------------------
    // Validate input
    // -----------------------------------------

    if (!student_id || !tutor_id || !slot_id) {

        return res.status(400).json({
            error:
                "student_id, tutor_id and slot_id are required"
        });

    }


    // -----------------------------------------
    // Check request
    // -----------------------------------------

    const requestSQL = `
        SELECT
            cr.request_id,
            cr.student_id,
            cr.subject_id,
            cr.topic,
            cr.preferred_time,
            cr.budget,
            cr.mode,
            s.subject_name
        FROM Coaching_Request cr
        JOIN Subject s
            ON cr.subject_id = s.subject_id
        WHERE cr.request_id = ?
    `;


    db.query(
        requestSQL,
        [requestId],
        (err, requestResults) => {

            if (err) {

                console.error(
                    "REQUEST CHECK ERROR:",
                    err
                );

                return res.status(500).json({
                    error:
                        "Failed to check coaching request"
                });

            }


            if (requestResults.length === 0) {

                return res.status(404).json({
                    error:
                        "Coaching request not found"
                });

            }


            const request = requestResults[0];


            // -----------------------------------------
            // Verify student owns request
            // -----------------------------------------

            if (
                Number(request.student_id) !==
                Number(student_id)
            ) {

                return res.status(403).json({
                    error:
                        "This request does not belong to this student"
                });

            }


            // -----------------------------------------
            // Check selected slot
            // -----------------------------------------

            const slotSQL = `
                SELECT
                    slot_id,
                    tutor_id,
                    start_time,
                    end_time,
                    status
                FROM Availability_Slot
                WHERE slot_id = ?
                  AND tutor_id = ?
            `;


            db.query(
                slotSQL,
                [slot_id, tutor_id],
                (slotErr, slotResults) => {

                    if (slotErr) {

                        console.error(
                            "SLOT CHECK ERROR:",
                            slotErr
                        );

                        return res.status(500).json({
                            error:
                                "Failed to check tutor slot"
                        });

                    }


                    if (slotResults.length === 0) {

                        return res.status(404).json({
                            error:
                                "Selected tutor slot not found"
                        });

                    }


                    const slot = slotResults[0];


                    // -----------------------------------------
                    // Check slot availability
                    // -----------------------------------------

                    if (slot.status !== "AVAILABLE") {

                        return res.status(409).json({
                            error:
                                "Selected tutor slot is no longer available"
                        });

                    }


                    // -----------------------------------------
                    // Update request to PENDING
                    // -----------------------------------------

                    const updateSQL = `
                        UPDATE Coaching_Request
                        SET status = 'PENDING'
                        WHERE request_id = ?
                    `;


                    db.query(
                        updateSQL,
                        [requestId],
                        (updateErr) => {

                            if (updateErr) {

                                console.error(
                                    "REQUEST UPDATE ERROR:",
                                    updateErr
                                );

                                return res.status(500).json({
                                    error:
                                        "Failed to update request"
                                });

                            }


                            // -----------------------------------------
                            // Send request to tutor through Socket.IO
                            // -----------------------------------------

                            const io =
                                req.app.get("io");

                            const tutorSockets =
                                req.app.get("tutorSockets");


                            const tutorSocketId =
                                tutorSockets
                                    ? tutorSockets.get(
                                        Number(tutor_id)
                                    )
                                    : null;


                            if (
                                io &&
                                tutorSocketId
                            ) {

                                io.to(tutorSocketId).emit(
                                    "newCoachingRequest",
                                    {

                                        request_id:
                                            request.request_id,

                                        student_id:
                                            request.student_id,

                                        subject_id:
                                            request.subject_id,

                                        subject_name:
                                            request.subject_name,

                                        topic:
                                            request.topic,

                                        preferred_time:
                                            request.preferred_time,

                                        budget:
                                            request.budget,

                                        mode:
                                            request.mode,

                                        tutor_id:
                                            Number(tutor_id),

                                        slot_id:
                                            Number(slot_id),

                                        start_time:
                                            slot.start_time,

                                        end_time:
                                            slot.end_time

                                    }
                                );

                            }


                            // -----------------------------------------
                            // Response
                            // -----------------------------------------

                            res.json({

                                message:
                                    tutorSocketId
                                        ? "Tutor request sent successfully"
                                        : "Tutor selected. Tutor is currently offline.",

                                request_id:
                                    request.request_id,

                                student_id:
                                    request.student_id,

                                tutor_id:
                                    Number(tutor_id),

                                slot_id:
                                    Number(slot_id),

                                tutor_online:
                                    Boolean(
                                        tutorSocketId
                                    ),

                                status:
                                    "PENDING"

                            });

                        }
                    );

                }
            );

        }
    );

});



// =========================================
// ACCEPT REQUEST
// =========================================

router.post("/:requestId/accept", (req, res) => {

    const requestId = req.params.requestId;

    const {
        tutor_id,
        slot_id
    } = req.body;


    // -----------------------------------------
    // Validate input
    // -----------------------------------------

    if (!tutor_id || !slot_id) {

        return res.status(400).json({
            error:
                "tutor_id and slot_id are required"
        });

    }


    // -----------------------------------------
    // Start transaction
    // -----------------------------------------

    db.beginTransaction((transactionError) => {

        if (transactionError) {

            console.error(
                "TRANSACTION ERROR:",
                transactionError
            );

            return res.status(500).json({
                error:
                    "Failed to start booking transaction"
            });

        }


        // -----------------------------------------
        // Get request and student
        // -----------------------------------------

        const requestSQL = `
            SELECT
                request_id,
                student_id,
                subject_id,
                topic,
                preferred_time,
                budget,
                mode,
                status
            FROM Coaching_Request
            WHERE request_id = ?
            FOR UPDATE
        `;


        db.query(
            requestSQL,
            [requestId],
            (requestError, requestResults) => {

                if (requestError) {

                    return db.rollback(() => {

                        console.error(
                            "REQUEST LOCK ERROR:",
                            requestError
                        );

                        res.status(500).json({
                            error:
                                "Failed to fetch coaching request"
                        });

                    });

                }


                // -----------------------------------------
                // Request not found
                // -----------------------------------------

                if (requestResults.length === 0) {

                    return db.rollback(() => {

                        res.status(404).json({
                            error:
                                "Coaching request not found"
                        });

                    });

                }


                const request =
                    requestResults[0];

                const studentId =
                    request.student_id;


                // -----------------------------------------
                // Request must be PENDING
                // -----------------------------------------

                if (request.status !== "PENDING") {

                    return db.rollback(() => {

                        res.status(409).json({
                            error:
                                "Request is no longer pending"
                        });

                    });

                }


                // -----------------------------------------
                // Lock the selected slot
                // -----------------------------------------

                const slotSQL = `
                    SELECT
                        slot_id,
                        tutor_id,
                        status
                    FROM Availability_Slot
                    WHERE slot_id = ?
                      AND tutor_id = ?
                    FOR UPDATE
                `;


                db.query(
                    slotSQL,
                    [slot_id, tutor_id],
                    (slotError, slotResults) => {

                        if (slotError) {

                            return db.rollback(() => {

                                console.error(
                                    "SLOT LOCK ERROR:",
                                    slotError
                                );

                                res.status(500).json({
                                    error:
                                        "Failed to lock tutor slot"
                                });

                            });

                        }


                        // -----------------------------------------
                        // Slot not found
                        // -----------------------------------------

                        if (slotResults.length === 0) {

                            return db.rollback(() => {

                                res.status(404).json({
                                    error:
                                        "Tutor slot not found"
                                });

                            });

                        }


                        // -----------------------------------------
                        // Check slot availability
                        // -----------------------------------------

                        if (
                            slotResults[0].status !==
                            "AVAILABLE"
                        ) {

                            return db.rollback(() => {

                                res.status(409).json({
                                    error:
                                        "Tutor slot is no longer available"
                                });

                            });

                        }


                        // -----------------------------------------
                        // Create Booking
                        // -----------------------------------------

                        const bookingSQL = `
                            INSERT INTO Booking
                            (
                                request_id,
                                student_id,
                                tutor_id,
                                slot_id,
                                booking_status
                            )
                            SELECT
                                request_id,
                                student_id,
                                ?,
                                ?,
                                'CONFIRMED'
                            FROM Coaching_Request
                            WHERE request_id = ?
                              AND status = 'PENDING'
                        `;


                        db.query(
                            bookingSQL,
                            [
                                tutor_id,
                                slot_id,
                                requestId
                            ],
                            (bookingError, bookingResult) => {

                                if (bookingError) {

                                    return db.rollback(() => {

                                        console.error(
                                            "BOOKING INSERT ERROR:",
                                            bookingError
                                        );

                                        res.status(500).json({
                                            error:
                                                "Failed to create booking"
                                        });

                                    });

                                }


                                // -----------------------------------------
                                // Booking not created
                                // -----------------------------------------

                                if (
                                    bookingResult.affectedRows ===
                                    0
                                ) {

                                    return db.rollback(() => {

                                        res.status(409).json({
                                            error:
                                                "Request is no longer pending"
                                        });

                                    });

                                }


                                const bookingId =
                                    bookingResult.insertId;


                                // -----------------------------------------
                                // Mark slot as BOOKED
                                // -----------------------------------------

                                const updateSlotSQL = `
                                    UPDATE Availability_Slot
                                    SET status = 'BOOKED'
                                    WHERE slot_id = ?
                                      AND tutor_id = ?
                                      AND status = 'AVAILABLE'
                                `;


                                db.query(
                                    updateSlotSQL,
                                    [slot_id, tutor_id],
                                    (updateSlotError) => {

                                        if (updateSlotError) {

                                            return db.rollback(() => {

                                                console.error(
                                                    "SLOT UPDATE ERROR:",
                                                    updateSlotError
                                                );

                                                res.status(500).json({
                                                    error:
                                                        "Failed to update tutor slot"
                                                });

                                            });

                                        }


                                        // -----------------------------------------
                                        // Update request to ACCEPTED
                                        // -----------------------------------------

                                        const updateRequestSQL = `
                                            UPDATE Coaching_Request
                                            SET status = 'ACCEPTED'
                                            WHERE request_id = ?
                                        `;


                                        db.query(
                                            updateRequestSQL,
                                            [requestId],
                                            (updateRequestError) => {

                                                if (
                                                    updateRequestError
                                                ) {

                                                    return db.rollback(() => {

                                                        console.error(
                                                            "REQUEST STATUS ERROR:",
                                                            updateRequestError
                                                        );

                                                        res.status(500).json({
                                                            error:
                                                                "Failed to update request status"
                                                        });

                                                    });

                                                }


                                                // -----------------------------------------
                                                // COMMIT TRANSACTION
                                                // -----------------------------------------

                                                db.commit(
                                                    (commitError) => {

                                                        if (
                                                            commitError
                                                        ) {

                                                            return db.rollback(() => {

                                                                console.error(
                                                                    "COMMIT ERROR:",
                                                                    commitError
                                                                );

                                                                res.status(500).json({
                                                                    error:
                                                                        "Failed to confirm booking"
                                                                });

                                                            });

                                                        }


                                                        // -----------------------------------------
                                                        // SEND ACCEPTED RESULT TO STUDENT
                                                        // -----------------------------------------

                                                        const io =
                                                            req.app.get("io");

                                                        const studentSockets =
                                                            req.app.get(
                                                                "studentSockets"
                                                            );


                                                        const studentSocketId =
                                                            studentSockets
                                                                ? studentSockets.get(
                                                                    Number(studentId)
                                                                )
                                                                : null;


                                                        if (
                                                            io &&
                                                            studentSocketId
                                                        ) {

                                                            io.to(
                                                                studentSocketId
                                                            ).emit(
                                                                "requestStatusUpdated",
                                                                {

                                                                    request_id:
                                                                        Number(
                                                                            requestId
                                                                        ),

                                                                    status:
                                                                        "ACCEPTED",

                                                                    message:
                                                                        "Your tutor request has been accepted. Booking confirmed.",

                                                                    tutor_id:
                                                                        Number(
                                                                            tutor_id
                                                                        ),

                                                                    booking_id:
                                                                        bookingId

                                                                }
                                                            );


                                                            console.log(
                                                                `Acceptance notification sent to student ${studentId}`
                                                            );

                                                        } else {

                                                            console.log(
                                                                `Student ${studentId} is not connected`
                                                            );

                                                        }


                                                        // -----------------------------------------
                                                        // Response to Tutor
                                                        // -----------------------------------------

                                                        res.json({

                                                            message:
                                                                "Request accepted and booking confirmed",

                                                            request_id:
                                                                Number(
                                                                    requestId
                                                                ),

                                                            student_id:
                                                                Number(
                                                                    studentId
                                                                ),

                                                            tutor_id:
                                                                Number(
                                                                    tutor_id
                                                                ),

                                                            slot_id:
                                                                Number(
                                                                    slot_id
                                                                ),

                                                            booking_id:
                                                                bookingId,

                                                            request_status:
                                                                "ACCEPTED",

                                                            booking_status:
                                                                "CONFIRMED",

                                                            slot_status:
                                                                "BOOKED"

                                                        });

                                                    }
                                                );

                                            }
                                        );

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



// =========================================
// REJECT REQUEST
// =========================================

router.post("/:requestId/reject", (req, res) => {

    const requestId = req.params.requestId;

    const {
        tutor_id
    } = req.body;


    // -----------------------------------------
    // Validate input
    // -----------------------------------------

    if (!tutor_id) {

        return res.status(400).json({
            error:
                "tutor_id is required"
        });

    }


    // -----------------------------------------
    // First get student ID
    // -----------------------------------------

    const requestSQL = `
        SELECT
            request_id,
            student_id,
            status
        FROM Coaching_Request
        WHERE request_id = ?
    `;


    db.query(
        requestSQL,
        [requestId],
        (requestError, requestResults) => {

            if (requestError) {

                console.error(
                    "REJECT REQUEST CHECK ERROR:",
                    requestError
                );

                return res.status(500).json({
                    error:
                        "Failed to check request"
                });

            }


            if (requestResults.length === 0) {

                return res.status(404).json({
                    error:
                        "Request not found"
                });

            }


            const request =
                requestResults[0];

            const studentId =
                request.student_id;


            // -----------------------------------------
            // Make sure request is still pending
            // -----------------------------------------

            if (request.status !== "PENDING") {

                return res.status(409).json({
                    error:
                        "Request is no longer pending"
                });

            }


            // -----------------------------------------
            // Update request
            // -----------------------------------------

            const sql = `
                UPDATE Coaching_Request
                SET status = 'REJECTED'
                WHERE request_id = ?
                  AND status = 'PENDING'
            `;


            db.query(
                sql,
                [requestId],
                (err, result) => {

                    if (err) {

                        console.error(
                            "REJECT REQUEST ERROR:",
                            err
                        );

                        return res.status(500).json({
                            error:
                                "Failed to reject request"
                        });

                    }


                    if (result.affectedRows === 0) {

                        return res.status(409).json({
                            error:
                                "Request is no longer pending"
                        });

                    }


                    // -----------------------------------------
                    // Send REJECTED result to student
                    // -----------------------------------------

                    const io =
                        req.app.get("io");

                    const studentSockets =
                        req.app.get(
                            "studentSockets"
                        );


                    const studentSocketId =
                        studentSockets
                            ? studentSockets.get(
                                Number(studentId)
                            )
                            : null;


                    if (
                        io &&
                        studentSocketId
                    ) {

                        io.to(
                            studentSocketId
                        ).emit(
                            "requestStatusUpdated",
                            {

                                request_id:
                                    Number(
                                        requestId
                                    ),

                                status:
                                    "REJECTED",

                                message:
                                    "Your tutor request has been rejected.",

                                tutor_id:
                                    Number(
                                        tutor_id
                                    )

                            }
                        );


                        console.log(
                            `Rejection notification sent to student ${studentId}`
                        );

                    } else {

                        console.log(
                            `Student ${studentId} is not connected`
                        );

                    }


                    // -----------------------------------------
                    // Response
                    // -----------------------------------------

                    res.json({

                        message:
                            "Tutor request rejected",

                        request_id:
                            Number(
                                requestId
                            ),

                        student_id:
                            Number(
                                studentId
                            ),

                        tutor_id:
                            Number(
                                tutor_id
                            ),

                        status:
                            "REJECTED"

                    });

                }
            );

        }
    );

});



module.exports = router;