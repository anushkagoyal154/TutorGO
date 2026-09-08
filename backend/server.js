const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./db");

const tutorRoutes = require("./routes/tutorRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const coachingRequestRoutes = require("./routes/coachingRequestRoutes");
const matchingRoutes = require("./routes/matchingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const tutorRequestRoutes = require("./routes/tutorRequestRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();


// ----------------------------------
// Create HTTP Server
// ----------------------------------

const server = http.createServer(app);


// ----------------------------------
// Create Socket.IO Server
// ----------------------------------

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});


// ----------------------------------
// Middleware
// ----------------------------------

app.use(cors());
app.use(express.json());


// ----------------------------------
// Store Connected Tutor & Student Sockets
// ----------------------------------

const tutorSockets = new Map();
const studentSockets = new Map();

app.set("io", io);
app.set("tutorSockets", tutorSockets);
app.set("studentSockets", studentSockets);


// ----------------------------------
// Socket.IO Connection
// ----------------------------------

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);


    // -------------------------
    // Register Tutor
    // -------------------------

    socket.on("registerTutor", (tutorId) => {

        tutorSockets.set(
            Number(tutorId),
            socket.id
        );

        console.log(
            `Tutor ${tutorId} registered with socket ${socket.id}`
        );

    });


    // -------------------------
    // Register Student
    // -------------------------

    socket.on("registerStudent", (studentId) => {

        studentSockets.set(
            Number(studentId),
            socket.id
        );

        console.log(
            `Student ${studentId} registered with socket ${socket.id}`
        );

    });


    // -------------------------
    // Disconnect
    // -------------------------

    socket.on("disconnect", () => {

        console.log(
            "User disconnected:",
            socket.id
        );


        // Remove disconnected tutor
        for (
            const [tutorId, socketId]
            of tutorSockets.entries()
        ) {

            if (socketId === socket.id) {

                tutorSockets.delete(tutorId);

                console.log(
                    `Tutor ${tutorId} removed`
                );

            }

        }


        // Remove disconnected student
        for (
            const [studentId, socketId]
            of studentSockets.entries()
        ) {

            if (socketId === socket.id) {

                studentSockets.delete(studentId);

                console.log(
                    `Student ${studentId} removed`
                );

            }

        }

    });

});


// ----------------------------------
// Home Route
// ----------------------------------

app.get("/", (req, res) => {

    res.send(
        "TutorGo Backend is Running!"
    );

});


// ----------------------------------
// Get All Tutors
// ----------------------------------

app.get("/tutors", (req, res) => {

    const sql = "SELECT * FROM Tutor";

    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Database query failed"
            });

        }

        res.json(results);

    });

});


// ----------------------------------
// API Routes
// ----------------------------------

app.use(
    "/api/tutors",
    tutorRoutes
);

app.use(
    "/api/resume",
    resumeRoutes
);

app.use(
    "/api/availability",
    availabilityRoutes
);

app.use(
    "/api/requests",
    coachingRequestRoutes
);

app.use(
    "/api/matching",
    matchingRoutes
);

app.use(
    "/api/bookings",
    bookingRoutes
);

app.use(
    "/api/tutor-requests",
    tutorRequestRoutes
);

app.use(
    "/api/students",
    studentRoutes
);


// ----------------------------------
// Start Server
// ----------------------------------

const PORT = 5000;

server.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});