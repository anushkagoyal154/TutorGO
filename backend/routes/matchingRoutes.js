const express = require("express");
const db = require("../db");

const router = express.Router();


// ----------------------------------
// Match Tutors for a Request
// ----------------------------------

router.get("/:requestId", (req, res) => {

    const requestId = req.params.requestId;


    // ----------------------------------
    // Get Student Request
    // ----------------------------------

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

                console.error(err);

                return res.status(500).json({
                    error: "Failed to fetch coaching request"
                });

            }


            if (requestResults.length === 0) {

                return res.status(404).json({
                    error: "Coaching request not found"
                });

            }


            const request = requestResults[0];


            // ----------------------------------
            // Find Matching Tutors
            // ----------------------------------

            const tutorSQL = `
                SELECT DISTINCT

                    t.tutor_id,
                    t.name,
                    t.qualification,
                    t.experience,
                    t.price_per_session,
                    t.rating,
                    t.location,

                    te.expertise_level,

                    a.slot_id,
                    a.start_time,
                    a.end_time,
                    a.status

                FROM Tutor t

                JOIN Tutor_Expertise te
                    ON t.tutor_id = te.tutor_id

                JOIN Availability_Slot a
                    ON t.tutor_id = a.tutor_id

                WHERE te.subject_id = ?

                AND a.status = 'AVAILABLE'

                AND a.start_time <= ?

                AND a.end_time >= ?

                AND (
                    ? IS NULL
                    OR t.price_per_session <= ?
                )

                ORDER BY t.rating DESC
            `;


            db.query(
                tutorSQL,
                [
                    request.subject_id,
                    request.preferred_time,
                    request.preferred_time,
                    request.budget,
                    request.budget
                ],
                (err, tutorResults) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            error: "Failed to find matching tutors"
                        });

                    }


                    // ----------------------------------
                    // Calculate Match Scores
                    // ----------------------------------

                    const matchedTutors =
                        tutorResults.map(tutor => {


                            // -------------------------
                            // Expertise Score
                            // -------------------------

                            let expertiseScore = 0;


                            if (
                                tutor.expertise_level === "Advanced"
                            ) {

                                expertiseScore = 100;

                            }

                            else if (
                                tutor.expertise_level === "Intermediate"
                            ) {

                                expertiseScore = 70;

                            }

                            else if (
                                tutor.expertise_level === "Beginner"
                            ) {

                                expertiseScore = 40;

                            }


                            // -------------------------
                            // Rating Score
                            // -------------------------

                            const ratingScore =
                                (parseFloat(tutor.rating || 0) / 5) * 100;


                            // -------------------------
                            // Price Score
                            // -------------------------

                            let priceScore = 100;


                            if (request.budget) {

                                const price =
                                    parseFloat(
                                        tutor.price_per_session
                                    );

                                const budget =
                                    parseFloat(
                                        request.budget
                                    );


                                if (price <= budget) {

                                    priceScore =
                                        ((budget - price) / budget) * 100;


                                    // Minimum 50 points
                                    // for being within budget

                                    priceScore =
                                        Math.max(
                                            50,
                                            priceScore
                                        );

                                }

                                else {

                                    priceScore = 0;

                                }

                            }


                            // -------------------------
                            // Availability Score
                            // -------------------------

                            const availabilityScore = 100;


                            // -------------------------
                            // Experience Score
                            // -------------------------

                            const experience =
                                parseFloat(
                                    tutor.experience || 0
                                );


                            const experienceScore =
                                Math.min(
                                    100,
                                    experience * 10
                                );


                            // ----------------------------------
                            // Final Match Score
                            // ----------------------------------

                            const matchScore =

                                (expertiseScore * 0.35) +

                                (ratingScore * 0.25) +

                                (priceScore * 0.15) +

                                (availabilityScore * 0.15) +

                                (experienceScore * 0.10);


                            return {

                                tutor_id:
                                    tutor.tutor_id,

                                name:
                                    tutor.name,

                                qualification:
                                    tutor.qualification,

                                experience:
                                    tutor.experience,

                                rating:
                                    tutor.rating,

                                price_per_session:
                                    tutor.price_per_session,

                                location:
                                    tutor.location,

                                expertise_level:
                                    tutor.expertise_level,

                                available_slot: {

                                    slot_id:
                                        tutor.slot_id,

                                    start_time:
                                        tutor.start_time,

                                    end_time:
                                        tutor.end_time

                                },

                                match_score:
                                    Number(
                                        matchScore.toFixed(2)
                                    )

                            };

                        });


                    // ----------------------------------
                    // Sort by Match Score
                    // ----------------------------------

                    matchedTutors.sort(
                        (a, b) =>
                            b.match_score - a.match_score
                    );


                    // ==================================
                    // SOCKET.IO NOTIFICATION
                    // ==================================

                    if (matchedTutors.length > 0) {

                        const bestTutor =
                            matchedTutors[0];


                        // Get Socket.IO instance
                        const io =
                            req.app.get("io");


                        // Get tutor socket map
                        const tutorSockets =
                            req.app.get("tutorSockets");


                        // Find the socket of the
                        // matched tutor

                        const tutorSocketId =
                            tutorSockets.get(
                                Number(bestTutor.tutor_id)
                            );


                        // If tutor is online,
                        // send request in real time

                        if (
                            io &&
                            tutorSocketId
                        ) {

                            io.to(tutorSocketId).emit(
    "newCoachingRequest",
    {
        request_id: request.request_id,

        student_id: request.student_id,

        subject_id: request.subject_id,

        subject_name: request.subject_name,

        topic: request.topic,

        preferred_time: request.preferred_time,

        budget: request.budget,

        mode: request.mode,

        tutor_id: bestTutor.tutor_id,

        slot_id: bestTutor.available_slot.slot_id,

        start_time: bestTutor.available_slot.start_time,

        end_time: bestTutor.available_slot.end_time
    }
);


                            console.log(
                                `New request sent to Tutor ${bestTutor.tutor_id}`
                            );

                        }

                        else {

                            console.log(
                                `Tutor ${bestTutor.tutor_id} is not connected`
                            );

                        }

                    }


                    // ----------------------------------
                    // Return Result
                    // ----------------------------------

                    res.json({

                        request: {

                            request_id:
                                request.request_id,

                            subject:
                                request.subject_name,

                            topic:
                                request.topic,

                            preferred_time:
                                request.preferred_time,

                            budget:
                                request.budget,

                            mode:
                                request.mode

                        },

                        total_matches:
                            matchedTutors.length,

                        matched_tutors:
                            matchedTutors,

                        best_match:
                            matchedTutors.length > 0
                                ? matchedTutors[0]
                                : null

                    });

                }

            );

        }

    );

});


module.exports = router;