import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

function TutorDashboard({ profile }) {

    // =========================================
    // BASIC STATE
    // =========================================

    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState("");
    const [connected, setConnected] = useState(false);
    const [processingRequest, setProcessingRequest] = useState(null);

    // Tutor ID comes from saved SQL profile
    const tutorId = profile?.tutor_id;


    // =========================================
    // AVAILABILITY STATE
    // =========================================

    const [availabilitySlots, setAvailabilitySlots] =
        useState([]);

    const [availabilityDate, setAvailabilityDate] =
        useState("");

    const [availabilityStart, setAvailabilityStart] =
        useState("");

    const [availabilityEnd, setAvailabilityEnd] =
        useState("");

    const [availabilityLoading, setAvailabilityLoading] =
        useState(false);

    const [availabilityMessage, setAvailabilityMessage] =
        useState("");


    // =========================================
    // PROFILE DATA
    // =========================================

    const subjects = profile?.subjects || [];

    const expertise = profile?.expertise || {};


    // =========================================
    // FORMAT TIME
    // =========================================

    const formatTime = (date) => {

        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    // =========================================
    // FORMAT DATE + TIME
    // =========================================

    const formatDateTime = (date) => {

        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleString(
            [],
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    // =========================================
    // LOAD AVAILABILITY
    // =========================================

    const loadAvailability = async () => {

        if (!tutorId) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/availability/tutor/${tutorId}`
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to load availability"
                );

            }

            setAvailabilitySlots(
                data.slots || []
            );

        }
        catch (error) {

            console.error(
                "LOAD AVAILABILITY ERROR:",
                error
            );

        }

    };


    // =========================================
    // SOCKET.IO CONNECTION
    // =========================================

    useEffect(() => {

        if (!tutorId) {
            return;
        }

        const socket =
            io("http://localhost:5000");


        // -----------------------------------------
        // CONNECTED
        // -----------------------------------------

        socket.on("connect", () => {

            console.log(
                "Tutor connected:",
                socket.id
            );

            setConnected(true);


            // Register tutor with Socket.IO

            socket.emit(
                "registerTutor",
                tutorId
            );

        });


        // -----------------------------------------
        // NEW STUDENT REQUEST
        // -----------------------------------------

        socket.on(
            "newCoachingRequest",
            (request) => {

                console.log(
                    "New coaching request:",
                    request
                );

                setRequests(
                    (previous) => {

                        // Prevent duplicate request
                        // from being added

                        const alreadyExists =
                            previous.some(
                                (item) =>
                                    item.request_id ===
                                    request.request_id
                            );

                        if (alreadyExists) {
                            return previous;
                        }

                        return [
                            request,
                            ...previous
                        ];

                    }
                );

            }
        );


        // -----------------------------------------
        // DISCONNECTED
        // -----------------------------------------

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "Tutor disconnected"
                );

                setConnected(false);

            }
        );


        // -----------------------------------------
        // CLEANUP
        // -----------------------------------------

        return () => {

            socket.disconnect();

        };

    }, [tutorId]);


    // =========================================
    // LOAD AVAILABILITY WHEN DASHBOARD OPENS
    // =========================================

    useEffect(() => {

        if (!tutorId) {
            return;
        }

        loadAvailability();

    }, [tutorId]);


    // =========================================
    // ADD AVAILABILITY SLOT
    // =========================================

    const addAvailability = async (e) => {

        e.preventDefault();

        setAvailabilityMessage("");


        // -----------------------------------------
        // Validate form
        // -----------------------------------------

        if (
            !availabilityDate ||
            !availabilityStart ||
            !availabilityEnd
        ) {

            setAvailabilityMessage(
                "Please select date, start time and end time."
            );

            return;

        }


        // -----------------------------------------
        // Create date-time strings
        // -----------------------------------------

        const startTime =
            `${availabilityDate}T${availabilityStart}`;

        const endTime =
            `${availabilityDate}T${availabilityEnd}`;


        // -----------------------------------------
        // Frontend time validation
        // -----------------------------------------

        if (
            availabilityEnd <=
            availabilityStart
        ) {

            setAvailabilityMessage(
                "End time must be after start time."
            );

            return;

        }


        setAvailabilityLoading(true);


        try {

            const response = await fetch(
                "http://localhost:5000/api/availability",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        tutor_id:
                            tutorId,

                        start_time:
                            startTime,

                        end_time:
                            endTime

                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to add availability"
                );

            }


            setAvailabilityMessage(
                "✓ Availability added successfully."
            );


            // Clear form

            setAvailabilityDate("");
            setAvailabilityStart("");
            setAvailabilityEnd("");


            // Reload slots

            await loadAvailability();

        }
        catch (error) {

            console.error(
                "ADD AVAILABILITY ERROR:",
                error
            );

            setAvailabilityMessage(
                `❌ ${error.message}`
            );

        }
        finally {

            setAvailabilityLoading(false);

        }

    };


    // =========================================
    // DELETE AVAILABILITY SLOT
    // =========================================

    const deleteAvailability = async (
        slotId
    ) => {

        try {

            setAvailabilityMessage("");


            const response = await fetch(
                `http://localhost:5000/api/availability/${slotId}?tutor_id=${tutorId}`,
                {
                    method: "DELETE"
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to delete slot"
                );

            }


            setAvailabilityMessage(
                "Availability slot removed."
            );


            await loadAvailability();

        }
        catch (error) {

            console.error(
                "DELETE AVAILABILITY ERROR:",
                error
            );

            setAvailabilityMessage(
                `❌ ${error.message}`
            );

        }

    };


    // =========================================
    // ACCEPT REQUEST
    // =========================================

    const handleAccept = async (
        request
    ) => {

        setProcessingRequest(
            request.request_id
        );

        setMessage("");


        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/tutor-requests/${request.request_id}/accept`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            tutor_id:
                                tutorId,

                            slot_id:
                                request.slot_id

                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to accept request"
                );

            }


            setMessage(
                `Request ${request.request_id} accepted successfully. Booking confirmed.`
            );


            // Remove accepted request

            setRequests(
                (previous) =>
                    previous.filter(
                        (item) =>
                            item.request_id !==
                            request.request_id
                    )
            );


            // Refresh availability

            await loadAvailability();

        }
        catch (error) {

            console.error(
                "ACCEPT REQUEST ERROR:",
                error
            );

            setMessage(
                `❌ ${error.message}`
            );

        }
        finally {

            setProcessingRequest(null);

        }

    };


    // =========================================
    // REJECT REQUEST
    // =========================================

    const handleReject = async (
        request
    ) => {

        setProcessingRequest(
            request.request_id
        );

        setMessage("");


        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/tutor-requests/${request.request_id}/reject`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            tutor_id:
                                tutorId

                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to reject request"
                );

            }


            setMessage(
                `Request ${request.request_id} rejected.`
            );


            // Remove rejected request

            setRequests(
                (previous) =>
                    previous.filter(
                        (item) =>
                            item.request_id !==
                            request.request_id
                    )
            );


            // Refresh availability

            await loadAvailability();

        }
        catch (error) {

            console.error(
                "REJECT REQUEST ERROR:",
                error
            );

            setMessage(
                `❌ ${error.message}`
            );

        }
        finally {

            setProcessingRequest(null);

        }

    };


    // =========================================
    // NO PROFILE
    // =========================================

    if (!profile) {

        return (

            <div className="dashboard-page">

                <div className="dashboard-section">

                    <div className="empty-state">

                        <div className="empty-icon">
                            👨‍🏫
                        </div>

                        <h2>
                            Tutor Profile Not Found
                        </h2>

                        <p>
                            Please login or register first.
                        </p>

                    </div>

                </div>

            </div>

        );

    }


    // =========================================
    // DASHBOARD
    // =========================================

    return (

        <div className="dashboard-page">


            {/* =====================================
                HEADER
            ===================================== */}

            <div className="dashboard-header">

                <div>

                    <span className="dashboard-label">
                        TUTOR DASHBOARD
                    </span>

                    <h1>
                        Welcome,{" "}
                        {profile.name || "Tutor"} 👋
                    </h1>

                    <p>
                        Manage your profile and respond
                        to student tutoring requests.
                    </p>

                </div>


                {/* PROFILE BADGE */}

                <div className="profile-badge">

                    <span>
                        🎓
                    </span>

                    <div>

                        <strong>
                            {profile.name || "Tutor"}
                        </strong>

                        <small>
                            Tutor ID: {profile.tutor_id}
                        </small>

                    </div>

                </div>

            </div>


            {/* =====================================
                CONNECTION STATUS
            ===================================== */}

            <div
                className={
                    connected
                        ? "connection-status connected"
                        : "connection-status disconnected"
                }
            >

                <span className="status-dot">
                    ●
                </span>

                {connected
                    ? "Connected • Ready for requests"
                    : "Disconnected • Reconnecting..."
                }

            </div>


            {/* =====================================
                01 — PROFILE
            ===================================== */}

            <div className="dashboard-section">

                <div className="section-title">

                    <div>

                        <span>
                            01
                        </span>

                        <h2>
                            Your Profile
                        </h2>

                    </div>

                    <span className="saved-badge">
                        ✓ Saved
                    </span>

                </div>


                <div className="profile-grid">


                    {/* NAME */}

                    <div className="profile-info">

                        <span>
                            FULL NAME
                        </span>

                        <strong>
                            {profile.name || "—"}
                        </strong>

                    </div>


                    {/* EMAIL */}

                    <div className="profile-info">

                        <span>
                            EMAIL
                        </span>

                        <strong>
                            {profile.email || "—"}
                        </strong>

                    </div>


                    {/* QUALIFICATION */}

                    <div className="profile-info">

                        <span>
                            QUALIFICATION
                        </span>

                        <strong>
                            {profile.qualification || "—"}
                        </strong>

                    </div>


                    {/* EXPERIENCE */}

                    <div className="profile-info">

                        <span>
                            EXPERIENCE
                        </span>

                        <strong>
                            {profile.experience ?? "—"} years
                        </strong>

                    </div>


                    {/* PRICE */}

                    <div className="profile-info">

                        <span>
                            PRICE / SESSION
                        </span>

                        <strong>
                            ₹{profile.price_per_session || "—"}
                        </strong>

                    </div>


                    {/* LOCATION */}

                    <div className="profile-info">

                        <span>
                            LOCATION
                        </span>

                        <strong>
                            {profile.location || "—"}
                        </strong>

                    </div>


                    {/* RATING */}

                    <div className="profile-info">

                        <span>
                            RATING
                        </span>

                        <strong>
                            ⭐ {profile.rating || "New"}
                        </strong>

                    </div>


                    {/* RESUME */}

                    <div className="profile-info">

                        <span>
                            RESUME
                        </span>

                        <strong>
                            {profile.resume_path
                                ? "📄 Uploaded"
                                : "Not uploaded"}
                        </strong>

                    </div>

                </div>

            </div>


            {/* =====================================
                02 — EXPERTISE
            ===================================== */}

            {(subjects.length > 0 ||
                Object.keys(expertise).length > 0) && (

                <div className="dashboard-section">

                    <div className="section-title">

                        <div>

                            <span>
                                02
                            </span>

                            <h2>
                                Expertise
                            </h2>

                        </div>

                        <span className="saved-badge">
                            {subjects.length} Subjects
                        </span>

                    </div>


                    <div className="expertise-list">

                        {subjects.map(
                            (subject) => (

                                <div
                                    className="expertise-item"
                                    key={subject}
                                >

                                    <div>

                                        <strong>
                                            {subject}
                                        </strong>

                                        <small>
                                            Teaching expertise
                                        </small>

                                    </div>

                                    <span>
                                        {expertise[subject] ||
                                            "Intermediate"}
                                    </span>

                                </div>

                            )
                        )}

                    </div>

                </div>

            )}


            {/* =====================================
                03 — AVAILABILITY
            ===================================== */}

            <div className="dashboard-section">

                <div className="section-title">

                    <div>

                        <span>
                            03
                        </span>

                        <h2>
                            My Availability
                        </h2>

                    </div>

                    <span className="saved-badge">
                        {availabilitySlots.length}{" "}
                        {availabilitySlots.length === 1
                            ? "Slot"
                            : "Slots"}
                    </span>

                </div>


                <p
                    style={{
                        marginTop: "-8px",
                        marginBottom: "20px",
                        color: "#737b8c",
                        fontSize: "13px"
                    }}
                >
                    Add the time periods when you are
                    available to teach students.
                </p>


                {/* =================================
                    ADD AVAILABILITY FORM
                ================================= */}

                <form
                    onSubmit={addAvailability}
                    className="availability-form"
                >

                    {/* DATE */}

                    <div>

                        <label>
                            DATE
                        </label>

                        <input
                            type="date"
                            value={availabilityDate}
                            onChange={(e) =>
                                setAvailabilityDate(
                                    e.target.value
                                )
                            }
                            min={
                                new Date()
                                    .toISOString()
                                    .split("T")[0]
                            }
                        />

                    </div>


                    {/* START TIME */}

                    <div>

                        <label>
                            START TIME
                        </label>

                        <input
                            type="time"
                            value={availabilityStart}
                            onChange={(e) =>
                                setAvailabilityStart(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    {/* END TIME */}

                    <div>

                        <label>
                            END TIME
                        </label>

                        <input
                            type="time"
                            value={availabilityEnd}
                            onChange={(e) =>
                                setAvailabilityEnd(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    {/* ADD BUTTON */}

                    <button
                        type="submit"
                        className="add-slot-button"
                        disabled={availabilityLoading}
                    >

                        {availabilityLoading
                            ? "Adding..."
                            : "+ Add Availability"
                        }

                    </button>

                </form>


                {/* =================================
                    AVAILABILITY MESSAGE
                ================================= */}

                {availabilityMessage && (

                    <div className="availability-message">

                        {availabilityMessage}

                    </div>

                )}


                {/* =================================
                    EXISTING SLOTS
                ================================= */}

                {availabilitySlots.length === 0 ? (

                    <div className="availability-empty">

                        <span>
                            🗓️
                        </span>

                        <p>
                            No availability slots added yet.
                        </p>

                        <small>
                            Add your available teaching
                            times above.
                        </small>

                    </div>

                ) : (

                    <div className="availability-list">

                        {availabilitySlots.map(
                            (slot) => (

                                <div
                                    className="availability-item"
                                    key={slot.slot_id}
                                >

                                    <div>

                                        <strong>

                                            {new Date(
                                                slot.start_time
                                            ).toLocaleDateString(
                                                [],
                                                {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric"
                                                }
                                            )}

                                        </strong>

                                        <span>

                                            {formatTime(
                                                slot.start_time
                                            )}

                                            {" – "}

                                            {formatTime(
                                                slot.end_time
                                            )}

                                        </span>

                                    </div>


                                    <div className="availability-actions">

                                        <span
                                            className={
                                                slot.status ===
                                                "AVAILABLE"
                                                    ? "available-badge"
                                                    : "booked-badge"
                                            }
                                        >

                                            {slot.status}

                                        </span>


                                        {slot.status ===
                                            "AVAILABLE" && (

                                            <button
                                                type="button"
                                                className="delete-slot-button"
                                                onClick={() =>
                                                    deleteAvailability(
                                                        slot.slot_id
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>

                                        )}

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* =====================================
                04 — STUDENT REQUESTS
            ===================================== */}

            <div className="dashboard-section">

                <div className="section-title">

                    <div>

                        <span>
                            04
                        </span>

                        <h2>
                            Student Requests
                        </h2>

                    </div>


                    <span className="request-count">

                        {requests.length}

                        {" "}

                        {requests.length === 1
                            ? "Pending Request"
                            : "Pending Requests"}

                    </span>

                </div>


                {/* =================================
                    MESSAGE
                ================================= */}

                {message && (

                    <div className="dashboard-message">

                        {message}

                    </div>

                )}


                {/* =================================
                    NO REQUESTS
                ================================= */}

                {requests.length === 0 ? (

                    <div className="empty-state">

                        <div className="empty-icon">
                            📬
                        </div>

                        <h3>
                            No new requests
                        </h3>

                        <p>
                            Student tutoring requests
                            will appear here in real time.
                        </p>

                        <span className="empty-status">
                            ● Listening for new requests
                        </span>

                    </div>

                ) : (


                    /* =================================
                       REQUEST LIST
                    ================================= */

                    <div className="request-list">

                        {requests.map(
                            (request) => (

                                <div
                                    className="request-card"
                                    key={request.request_id}
                                >


                                    {/* REQUEST TOP */}

                                    <div className="request-top">

                                        <div>

                                            <span className="request-id">

                                                REQUEST #
                                                {request.request_id}

                                            </span>

                                            <h3>
                                                {request.subject_name ||
                                                    "Subject"}
                                            </h3>

                                        </div>


                                        <span className="live-badge">
                                            ● LIVE
                                        </span>

                                    </div>


                                    {/* REQUEST DETAILS */}

                                    <div className="request-details">


                                        {/* TOPIC */}

                                        <div>

                                            <span>
                                                TOPIC
                                            </span>

                                            <strong>
                                                {request.topic ||
                                                    "—"}
                                            </strong>

                                        </div>


                                        {/* BUDGET */}

                                        <div>

                                            <span>
                                                BUDGET
                                            </span>

                                            <strong>
                                                ₹{request.budget ||
                                                    "—"}
                                            </strong>

                                        </div>


                                        {/* MODE */}

                                        <div>

                                            <span>
                                                MODE
                                            </span>

                                            <strong>
                                                {request.mode ||
                                                    "—"}
                                            </strong>

                                        </div>


                                        {/* PREFERRED TIME */}

                                        <div>

                                            <span>
                                                PREFERRED TIME
                                            </span>

                                            <strong>
                                                {formatDateTime(
                                                    request.preferred_time
                                                )}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* =================================
                                        AVAILABLE SLOT
                                    ================================= */}

                                    <div className="slot-info">

                                        <div>

                                            <span>
                                                AVAILABLE SLOT
                                            </span>

                                            <strong>
                                                Slot #{request.slot_id}
                                            </strong>

                                        </div>

                                        <small>

                                            {formatTime(
                                                request.start_time
                                            )}

                                            {" – "}

                                            {formatTime(
                                                request.end_time
                                            )}

                                        </small>

                                    </div>


                                    {/* =================================
                                        ACTIONS
                                    ================================= */}

                                    <div className="request-actions">


                                        {/* ACCEPT */}

                                        <button
                                            className="accept-button"
                                            onClick={() =>
                                                handleAccept(
                                                    request
                                                )
                                            }
                                            disabled={
                                                processingRequest ===
                                                request.request_id
                                            }
                                        >

                                            {processingRequest ===
                                            request.request_id
                                                ? "Processing..."
                                                : "✓ Accept"}

                                        </button>


                                        {/* REJECT */}

                                        <button
                                            className="reject-button"
                                            onClick={() =>
                                                handleReject(
                                                    request
                                                )
                                            }
                                            disabled={
                                                processingRequest ===
                                                request.request_id
                                            }
                                        >

                                            {processingRequest ===
                                            request.request_id
                                                ? "Please wait..."
                                                : "✕ Reject"}

                                        </button>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* =====================================
                SYSTEM STATUS
            ===================================== */}

            <div className="system-status">

                <span className="status-dot">
                    ●
                </span>

                <span>
                    TutorGo matching system is active
                </span>

            </div>


        </div>

    );

}


export default TutorDashboard;