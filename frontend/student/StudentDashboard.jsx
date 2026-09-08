import { useEffect, useState } from "react";
import { io } from "socket.io-client";


function StudentDashboard({ profile }) {

    const studentId = profile?.student_id;


    // ----------------------------------
    // Form States
    // ----------------------------------

    const [topic, setTopic] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [budget, setBudget] = useState("");
    const [mode, setMode] = useState("Online");


    // ----------------------------------
    // Matching States
    // ----------------------------------

    const [result, setResult] = useState(null);
    const [selectedTutor, setSelectedTutor] = useState(null);


    // ----------------------------------
    // Request Status
    // ----------------------------------

    const [requestId, setRequestId] = useState(null);
    const [requestStatus, setRequestStatus] = useState(null);
    const [bookingId, setBookingId] = useState(null);


    // ----------------------------------
    // Loading States
    // ----------------------------------

    const [loading, setLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);


    // ----------------------------------
    // Messages
    // ----------------------------------

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =====================================================
    // STUDENT SOCKET.IO CONNECTION
    // =====================================================

    useEffect(() => {

        if (!studentId) {
            return;
        }


        console.log(
            "Connecting student to Socket.IO..."
        );


        const socket = io(
            "http://localhost:5000"
        );


        // ----------------------------------
        // Socket Connected
        // ----------------------------------

        socket.on("connect", () => {

            console.log(
                "Student Socket Connected:",
                socket.id
            );


            socket.emit(
                "registerStudent",
                studentId
            );


            console.log(
                `Student ${studentId} registered`
            );

        });


        // ----------------------------------
        // Tutor Accept / Reject
        // ----------------------------------

        socket.on(
            "requestStatusUpdated",
            (data) => {

                console.log(
                    "REQUEST STATUS UPDATE:",
                    data
                );


                // Make sure this update belongs
                // to the current request
                if (
                    requestId &&
                    Number(data.request_id) !==
                    Number(requestId)
                ) {

                    return;

                }


                // ----------------------------------
                // ACCEPTED
                // ----------------------------------

                if (
                    data.status === "ACCEPTED"
                ) {

                    setRequestStatus(
                        "ACCEPTED"
                    );


                    setBookingId(
                        data.booking_id
                    );


                    setSuccess(
                        data.message ||
                        "Your tutor request has been accepted. Booking confirmed."
                    );


                    setError("");

                }


                // ----------------------------------
                // REJECTED
                // ----------------------------------

                else if (
                    data.status === "REJECTED"
                ) {

                    setRequestStatus(
                        "REJECTED"
                    );


                    setSuccess("");


                    setError(
                        data.message ||
                        "Your tutor request has been rejected."
                    );


                    // Allow student to select
                    // another tutor
                    setSelectedTutor(null);

                }

            }
        );


        // ----------------------------------
        // Socket Disconnected
        // ----------------------------------

        socket.on("disconnect", () => {

            console.log(
                "Student Socket Disconnected"
            );

        });


        // ----------------------------------
        // Cleanup
        // ----------------------------------

        return () => {

            socket.disconnect();

        };

    }, [studentId, requestId]);


    // =====================================================
    // FIND TUTOR
    // =====================================================

    const findTutor = async (e) => {

        e.preventDefault();


        setError("");
        setSuccess("");

        setResult(null);
        setSelectedTutor(null);

        setRequestId(null);
        setRequestStatus(null);
        setBookingId(null);


        // ----------------------------------
        // Check Student
        // ----------------------------------

        if (!studentId) {

            setError(
                "Student profile not found. Please login again."
            );

            return;

        }


        // ----------------------------------
        // Validate Form
        // ----------------------------------

        if (
            !topic ||
            !preferredTime ||
            !budget
        ) {

            setError(
                "Please fill all required fields."
            );

            return;

        }


        setLoading(true);


        try {


            // ==================================
            // CREATE COACHING REQUEST
            // ==================================

            const requestResponse =
                await fetch(
                    "http://localhost:5000/api/requests",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            student_id:
                                studentId,

                            subject_id:
                                1,

                            topic:
                                topic,

                            preferred_time:
                                preferredTime,

                            budget:
                                Number(budget),

                            mode:
                                mode

                        })

                    }
                );


            const requestData =
                await requestResponse.json();


            if (!requestResponse.ok) {

                throw new Error(
                    requestData.error ||
                    "Failed to create coaching request"
                );

            }


            console.log(
                "Coaching Request Created:",
                requestData
            );


            // ==================================
            // SAVE REQUEST ID
            // ==================================

            setRequestId(
                requestData.request_id
            );


            // ==================================
            // RUN MATCHING ENGINE
            // ==================================

            const matchingResponse =
                await fetch(
                    `http://localhost:5000/api/matching/${requestData.request_id}`
                );


            const matchingData =
                await matchingResponse.json();


            if (!matchingResponse.ok) {

                throw new Error(
                    matchingData.error ||
                    "Matching failed"
                );

            }


            console.log(
                "Matching Result:",
                matchingData
            );


            setResult(
                matchingData
            );


        }
        catch (error) {

            console.error(
                "FIND TUTOR ERROR:",
                error
            );

            setError(
                error.message
            );

        }
        finally {

            setLoading(false);

        }

    };


    // =====================================================
    // SELECT TUTOR
    // =====================================================

    const selectTutor = async (tutor) => {

        setError("");
        setSuccess("");


        // ----------------------------------
        // Check Request
        // ----------------------------------

        if (
            !result?.request?.request_id
        ) {

            setError(
                "Request information is missing."
            );

            return;

        }


        // ----------------------------------
        // Check Student
        // ----------------------------------

        if (!studentId) {

            setError(
                "Student profile not found."
            );

            return;

        }


        // ----------------------------------
        // Check Slot
        // ----------------------------------

        if (
            !tutor?.available_slot?.slot_id
        ) {

            setError(
                "Selected tutor does not have a valid availability slot."
            );

            return;

        }


        setSelectedTutor(
            tutor
        );


        setBookingLoading(
            true
        );


        try {


            // ==================================
            // SEND REQUEST TO TUTOR
            // ==================================

            const response =
                await fetch(
                    `http://localhost:5000/api/tutor-requests/${result.request.request_id}/select`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            student_id:
                                studentId,

                            tutor_id:
                                tutor.tutor_id,

                            slot_id:
                                tutor.available_slot.slot_id

                        })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to send tutor request"
                );

            }


            console.log(
                "Tutor Request Response:",
                data
            );


            // ==================================
            // REQUEST IS NOW PENDING
            // ==================================

            setRequestId(
                data.request_id
            );


            setRequestStatus(
                "PENDING"
            );


            setBookingId(
                null
            );


            if (
                data.tutor_online
            ) {

                setSuccess(
                    `${tutor.name} has been notified. Waiting for tutor approval.`
                );

            }
            else {

                setSuccess(
                    `${tutor.name} was selected. The tutor is currently offline.`
                );

            }


        }
        catch (error) {

            console.error(
                "SELECT TUTOR ERROR:",
                error
            );


            setError(
                error.message
            );


            setSelectedTutor(
                null
            );

        }
        finally {

            setBookingLoading(
                false
            );

        }

    };


    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime = (time) => {

        if (!time) {
            return "Not available";
        }


        return new Date(
            time
        ).toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (time) => {

        if (!time) {
            return "";
        }


        return new Date(
            time
        ).toLocaleDateString(
            [],
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    // =====================================================
    // TOP MATCHES
    // =====================================================

    const matchedTutors =
        result?.matched_tutors?.slice(0, 5) || [];


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="dashboard-page">


            {/* ========================================= */}
            {/* HEADER */}
            {/* ========================================= */}

            <div className="dashboard-header">

                <div>

                    <h1>
                        Student Dashboard
                    </h1>

                    <p>
                        Welcome,{" "}
                        {profile?.name || "Student"} 👋
                    </p>

                </div>


                <div className="profile-badge">

                    🎓 Student

                </div>

            </div>



            {/* ========================================= */}
            {/* PROFILE */}
            {/* ========================================= */}

            {profile && (

                <div className="request-card">

                    <h2>
                        Your Profile
                    </h2>


                    <div className="profile-grid">


                        <div className="profile-info">

                            <strong>
                                Name
                            </strong>

                            <span>
                                {profile.name}
                            </span>

                        </div>


                        <div className="profile-info">

                            <strong>
                                Email
                            </strong>

                            <span>
                                {profile.email}
                            </span>

                        </div>


                    </div>

                </div>

            )}



            {/* ========================================= */}
            {/* FIND TUTOR */}
            {/* ========================================= */}

            <div className="request-card">

                <h2>
                    Find a Tutor
                </h2>

                <p>
                    Tell us what you need help with.
                </p>


                <form onSubmit={findTutor}>


                    {/* --------------------------------- */}
                    {/* Subject */}
                    {/* --------------------------------- */}

                    <label>
                        Subject
                    </label>


                    <select
                        value="1"
                        disabled
                    >

                        <option value="1">
                            DBMS
                        </option>

                    </select>



                    {/* --------------------------------- */}
                    {/* Topic */}
                    {/* --------------------------------- */}

                    <label>
                        Topic
                    </label>


                    <input
                        type="text"
                        placeholder="e.g. Normalization"
                        value={topic}
                        onChange={(e) =>
                            setTopic(
                                e.target.value
                            )
                        }
                    />



                    {/* --------------------------------- */}
                    {/* Preferred Time */}
                    {/* --------------------------------- */}

                    <label>
                        Preferred Date & Time
                    </label>


                    <input
                        type="datetime-local"
                        value={preferredTime}
                        onChange={(e) =>
                            setPreferredTime(
                                e.target.value
                            )
                        }
                    />



                    {/* --------------------------------- */}
                    {/* Budget */}
                    {/* --------------------------------- */}

                    <label>
                        Maximum Budget (₹)
                    </label>


                    <input
                        type="number"
                        placeholder="e.g. 600"
                        value={budget}
                        onChange={(e) =>
                            setBudget(
                                e.target.value
                            )
                        }
                    />



                    {/* --------------------------------- */}
                    {/* Mode */}
                    {/* --------------------------------- */}

                    <label>
                        Mode
                    </label>


                    <select
                        value={mode}
                        onChange={(e) =>
                            setMode(
                                e.target.value
                            )
                        }
                    >

                        <option value="Online">
                            Online
                        </option>

                        <option value="Offline">
                            Offline
                        </option>

                    </select>



                    {/* --------------------------------- */}
                    {/* Submit */}
                    {/* --------------------------------- */}

                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Finding Tutors..."
                            : "Find Tutors"
                        }

                    </button>


                </form>

            </div>



            {/* ========================================= */}
            {/* ERROR */}
            {/* ========================================= */}

            {error && (

                <div className="error-message">

                    {error}

                </div>

            )}



            {/* ========================================= */}
            {/* SUCCESS / STATUS */}
            {/* ========================================= */}

            {success && (

                <div className="success-message">

                    {success}

                </div>

            )}



            {/* ========================================= */}
            {/* ACCEPTED STATUS */}
            {/* ========================================= */}

            {requestStatus === "ACCEPTED" && (

                <div className="success-message">

                    ✅ Tutor accepted your request.
                    Booking confirmed.

                    {bookingId && (

                        <span>
                            {" "}Booking ID: {bookingId}
                        </span>

                    )}

                </div>

            )}



            {/* ========================================= */}
            {/* REJECTED STATUS */}
            {/* ========================================= */}

            {requestStatus === "REJECTED" && (

                <div className="error-message">

                    ❌ Tutor rejected your request.
                    Please select another tutor.

                </div>

            )}



            {/* ========================================= */}
            {/* MATCHING RESULTS */}
            {/* ========================================= */}

            {result && (

                <div className="match-result">


                    <h2>
                        Top Tutor Matches
                    </h2>


                    <p>

                        We found{" "}

                        <strong>
                            {result.total_matches}
                        </strong>{" "}

                        suitable tutor
                        {result.total_matches !== 1
                            ? "s"
                            : ""
                        }.

                    </p>



                    {/* --------------------------------- */}
                    {/* No Matches */}
                    {/* --------------------------------- */}

                    {matchedTutors.length === 0 ? (

                        <div className="request-card">

                            <h3>
                                No suitable tutor found.
                            </h3>

                            <p>
                                Try changing the time,
                                budget, or subject.
                            </p>

                        </div>

                    ) : (

                        <div className="role-cards">


                            {matchedTutors.map(
                                (tutor, index) => (

                                    <div
                                        className="tutor-card"
                                        key={
                                            tutor.tutor_id
                                        }
                                    >


                                        {/* ------------------------- */}
                                        {/* Rank */}
                                        {/* ------------------------- */}

                                        <div className="saved-badge">

                                            #{index + 1} Match

                                        </div>



                                        <h2>
                                            {tutor.name}
                                        </h2>



                                        <p>

                                            <strong>
                                                Qualification:
                                            </strong>{" "}

                                            {tutor.qualification}

                                        </p>



                                        <p>

                                            <strong>
                                                Experience:
                                            </strong>{" "}

                                            {tutor.experience}
                                            {" "}years

                                        </p>



                                        <p>

                                            <strong>
                                                Expertise:
                                            </strong>{" "}

                                            {tutor.expertise_level}

                                        </p>



                                        <p>

                                            <strong>
                                                Rating:
                                            </strong>{" "}

                                            ⭐ {tutor.rating}

                                        </p>



                                        <p>

                                            <strong>
                                                Price:
                                            </strong>{" "}

                                            ₹
                                            {tutor.price_per_session}

                                            {" / session"}

                                        </p>



                                        <p>

                                            <strong>
                                                Location:
                                            </strong>{" "}

                                            {tutor.location ||
                                                "Not specified"
                                            }

                                        </p>



                                        <p>

                                            <strong>
                                                Match Score:
                                            </strong>{" "}

                                            <span>
                                                {tutor.match_score}%
                                            </span>

                                        </p>



                                        {/* ------------------------- */}
                                        {/* Availability */}
                                        {/* ------------------------- */}

                                        <p>

                                            <strong>
                                                Available:
                                            </strong>

                                            <br />

                                            {formatDate(
                                                tutor
                                                    .available_slot
                                                    .start_time
                                            )}

                                            <br />

                                            {formatTime(
                                                tutor
                                                    .available_slot
                                                    .start_time
                                            )}

                                            {" - "}

                                            {formatTime(
                                                tutor
                                                    .available_slot
                                                    .end_time
                                            )}

                                        </p>



                                        {/* ------------------------- */}
                                        {/* Select Button */}
                                        {/* ------------------------- */}

                                        <button
                                            className="accept-button"

                                            disabled={
                                                bookingLoading ||
                                                requestStatus === "PENDING" ||
                                                requestStatus === "ACCEPTED"
                                            }

                                            onClick={() =>
                                                selectTutor(
                                                    tutor
                                                )
                                            }
                                        >

                                            {bookingLoading &&
                                            selectedTutor?.tutor_id ===
                                                tutor.tutor_id

                                                ? "Sending Request..."

                                                : requestStatus ===
                                                  "PENDING"

                                                ? "Waiting for Approval"

                                                : requestStatus ===
                                                  "ACCEPTED"

                                                ? "Booking Confirmed"

                                                : requestStatus ===
                                                  "REJECTED"

                                                ? "Select Tutor Again"

                                                : "Select Tutor"
                                            }

                                        </button>


                                    </div>

                                )
                            )}


                        </div>

                    )}

                </div>

            )}


        </div>

    );

}


export default StudentDashboard;