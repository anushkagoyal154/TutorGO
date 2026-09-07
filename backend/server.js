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
const tutorRequestRoutes=require("./routes/tutorRequestRoutes")
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
// Store connected tutor sockets
// ----------------------------------

const tutorSockets = new Map();
app.set("io", io);
app.set("tutorSockets", tutorSockets);


// ----------------------------------
// Socket.IO Connection
// ----------------------------------

io.on("connection", (socket) => {

    console.log(
        "User connected:",
        socket.id
    );


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
    // Disconnect
    // -------------------------

    socket.on("disconnect", () => {

        console.log(
            "User disconnected:",
            socket.id
        );


        // Remove tutor socket

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

    const sql =
        "SELECT * FROM Tutor";


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

app.use("/api/bookings", bookingRoutes);
app.use(
    "/api/tutor-requests",
    tutorRequestRoutes
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