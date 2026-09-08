const express = require("express");
const router = express.Router();

const db = require("../db");


// =========================================
// CREATE STUDENT
// =========================================

router.post("/", (req, res) => {

    const {
        name,
        email
    } = req.body;


    // -----------------------------------------
    // Basic validation
    // -----------------------------------------

    if (!name || !email) {

        return res.status(400).json({
            error: "Name and email are required"
        });

    }


    // -----------------------------------------
    // Insert student
    // -----------------------------------------

    const sql = `
        INSERT INTO Student
        (name, email)
        VALUES (?, ?)
    `;


    db.query(
        sql,
        [name, email],
        (err, result) => {

            if (err) {

                console.error(
                    "STUDENT CREATE ERROR:",
                    err
                );


                // Duplicate email
                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(409).json({
                        error:
                            "A student with this email already exists"
                    });

                }


                return res.status(500).json({
                    error: "Failed to create student"
                });

            }


            res.status(201).json({

                message:
                    "Student created successfully",

                student_id:
                    result.insertId

            });

        }
    );

});



// =========================================
// GET STUDENT PROFILE BY EMAIL
// =========================================

router.get("/profile", (req, res) => {

    const { email } = req.query;


    if (!email) {

        return res.status(400).json({
            error: "Email is required"
        });

    }


    const sql = `
        SELECT
            student_id,
            name,
            email
        FROM Student
        WHERE email = ?
    `;


    db.query(
        sql,
        [email],
        (err, results) => {

            if (err) {

                console.error(
                    "STUDENT PROFILE ERROR:",
                    err
                );


                return res.status(500).json({
                    error:
                        "Failed to fetch student profile"
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    error:
                        "Student profile not found"
                });

            }


            res.json({

                student: results[0]

            });

        }
    );

});


module.exports = router;