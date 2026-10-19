const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./db");
const cron = require("node-cron");

require("dotenv").config();


const tutorRoutes = require("./routes/tutorRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const coachingRequestRoutes = require("./routes/coachingRequestRoutes");
const matchingRoutes = require("./routes/matchingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const tutorRequestRoutes = require("./routes/tutorRequestRoutes");
const studentRoutes = require("./routes/studentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const authRoutes = require("./routes/authRoutes");


const {
    completeFinishedSessions
} = require("./services/sessionCompleteService");

const app = express();
const server = http.createServer(app);

const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
    cors: {
        origin: frontendUrl,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});

// Middleware
app.use(cors({ origin: frontendUrl }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket maps
const tutorSockets = new Map();
const studentSockets = new Map();

app.set("io", io);
app.set("tutorSockets", tutorSockets);
app.set("studentSockets", studentSockets);

// Socket.IO
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("registerTutor", (tutorId) => {
        const id = Number(tutorId);

        if (!Number.isInteger(id) || id <= 0) return;

        tutorSockets.set(id, socket.id);
        socket.tutorId = id;

        console.log(`Tutor ${id} registered with socket ${socket.id}`);
    });

    socket.on("registerStudent", (studentId) => {
        const id = Number(studentId);

        if (!Number.isInteger(id) || id <= 0) return;

        studentSockets.set(id, socket.id);
        socket.studentId = id;

        console.log(`Student ${id} registered with socket ${socket.id}`);
    });

    socket.on("registerUser", (data) => {
        if (!data || !data.role) return;

        const id = Number(data.id);
        const role = String(data.role).toLowerCase();

        if (!Number.isInteger(id) || id <= 0) return;

        if (role === "student") {
            studentSockets.set(id, socket.id);
            socket.studentId = id;
        } else if (role === "tutor") {
            tutorSockets.set(id, socket.id);
            socket.tutorId = id;
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(
            "User disconnected:",
            socket.id,
            "Reason:",
            reason
        );

        if (socket.tutorId !== undefined) {
            const id = Number(socket.tutorId);

            if (tutorSockets.get(id) === socket.id) {
                tutorSockets.delete(id);
            }
        }

        if (socket.studentId !== undefined) {
            const id = Number(socket.studentId);

            if (studentSockets.get(id) === socket.id) {
                studentSockets.delete(id);
            }
        }
    });
});

// Home
app.get("/", (req, res) => {
    res.status(200).send("TutorGo Backend is Running!");
});

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "TutorGo backend is healthy"
    });
});

// Get all tutors
app.get("/tutors", (req, res) => {
    db.query("SELECT * FROM Tutor", (error, results) => {
        if (error) {
            console.error("Get tutors error:", error);

            return res.status(500).json({
                success: false,
                error: "Database query failed"
            });
        }

        res.status(200).json({
            success: true,
            tutors: results
        });
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/requests", coachingRequestRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tutor-requests", tutorRequestRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);

// Automatically complete finished sessions every minute
cron.schedule("* * * * *", async () => {
    try {
        await completeFinishedSessions();
    } catch (error) {
        console.error("Session completion job error:", error);
    }
});

// 404 handler
app.use((req, res) => {
    if (res.headersSent) return;

    res.status(404).json({
        success: false,
        error: "Route not found",
        path: req.originalUrl
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("SERVER ERROR:", error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        error: "Internal server error"
    });
});

// Start server
const PORT = Number(process.env.PORT) || 5000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
    console.error("HTTP server error:", error);
});