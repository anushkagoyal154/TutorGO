import { useState } from "react";


function StudentDashboard() {

    // ----------------------------------
    // Student Request States
    // ----------------------------------

    const [topic, setTopic] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [budget, setBudget] = useState("");
    const [mode, setMode] = useState("Online");


    // ----------------------------------
    // Matching States
    // ----------------------------------

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
const [requestId, setRequestId] = useState(null);

    // ----------------------------------
    // Booking States
    // ----------------------------------

    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);


    // ----------------------------------
    // Error State
    // ----------------------------------

    const [error, setError] = useState("");


    // ==================================
    // FIND TUTOR
    // ==================================

    const findTutor = async (e) => {

        e.preventDefault();

        setLoading(true);
        setResult(null);
        setBookingResult(null);
        setError("");


        try {

            // -------------------------
            // Create Student Request
            // -------------------------

            const requestResponse = await fetch(
                "http://localhost:5000/api/requests",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        // Temporary student
                        // Currently we have one student
                        student_id: 1,

                        // DBMS = subject_id 1
                        subject_id: 1,

                        topic: topic,

                        preferred_time:
                            preferredTime.replace("T", " "),

                        budget:
                            budget || null,

                        mode: mode

                    })
                }
            );


            const requestData =
                await requestResponse.json();
                setRequestId(requestData.request_id);

            if (!requestResponse.ok) {

                throw new Error(
                    requestData.error ||
                    "Failed to create request"
                );

            }


            // -------------------------
            // Run Matching Engine
            // -------------------------

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


            // -------------------------
            // Display Matching Result
            // -------------------------

            setResult(matchingData);

        }

        catch (error) {

            console.error(error);

            setError(error.message);

        }

        finally {

            setLoading(false);

        }

    };


    // ==================================
    // BOOK TUTOR
    // ==================================

    const bookTutor = async () => {

        // Make sure a tutor was found
        if (!result || !result.best_match) {

            return;

        }


        setBookingLoading(true);
        setBookingResult(null);
        setError("");


        try {

            const tutor = result.best_match;


            // -------------------------
            // Send Booking Request
            // -------------------------

            const response = await fetch(
                "http://localhost:5000/api/bookings",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        // Request created earlier
                        request_id:
                            requestId,

                        // Temporary student
                        student_id: 1,

                        // Matched tutor
                        tutor_id:
                            tutor.tutor_id,

                        // Available tutor slot
                        slot_id:
                            tutor.available_slot.slot_id

                    })
                }
            );


            const data =
                await response.json();


            // -------------------------
            // Check Booking Response
            // -------------------------

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Booking failed"
                );

            }


            // -------------------------
            // Save Booking Result
            // -------------------------

            setBookingResult(data);

        }

        catch (error) {

            console.error(error);

            setError(error.message);

        }

        finally {

            setBookingLoading(false);

        }

    };


    // ==================================
    // USER INTERFACE
    // ==================================

    return (

        <div className="student-dashboard">


            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <h1>
                Student Dashboard
            </h1>

            <p>
                Find the right tutor for your learning needs.
            </p>



            {/* ================================= */}
            {/* REQUEST FORM */}
            {/* ================================= */}

            <div className="request-card">

                <h2>
                    Find a Tutor
                </h2>


                <form onSubmit={findTutor}>


                    {/* ------------------------- */}
                    {/* SUBJECT */}
                    {/* ------------------------- */}

                    <label>
                        Subject
                    </label>

                    <select>

                        <option value="1">
                            DBMS
                        </option>

                    </select>



                    {/* ------------------------- */}
                    {/* TOPIC */}
                    {/* ------------------------- */}

                    <label>
                        Topic
                    </label>

                    <input
                        type="text"
                        placeholder="e.g. Normalization"
                        value={topic}
                        onChange={(e) =>
                            setTopic(e.target.value)
                        }
                        required
                    />



                    {/* ------------------------- */}
                    {/* PREFERRED TIME */}
                    {/* ------------------------- */}

                    <label>
                        Preferred Time
                    </label>

                    <input
                        type="datetime-local"
                        value={preferredTime}
                        onChange={(e) =>
                            setPreferredTime(e.target.value)
                        }
                        required
                    />



                    {/* ------------------------- */}
                    {/* BUDGET */}
                    {/* ------------------------- */}

                    <label>
                        Maximum Budget
                    </label>

                    <input
                        type="number"
                        placeholder="e.g. 600"
                        value={budget}
                        onChange={(e) =>
                            setBudget(e.target.value)
                        }
                    />



                    {/* ------------------------- */}
                    {/* MODE */}
                    {/* ------------------------- */}

                    <label>
                        Mode
                    </label>

                    <select
                        value={mode}
                        onChange={(e) =>
                            setMode(e.target.value)
                        }
                    >

                        <option value="Online">
                            Online
                        </option>

                        <option value="Offline">
                            Offline
                        </option>

                    </select>



                    {/* ------------------------- */}
                    {/* FIND TUTOR BUTTON */}
                    {/* ------------------------- */}

                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Finding Tutor..."
                            : "Find Tutor"
                        }

                    </button>


                </form>

            </div>



            {/* ================================= */}
            {/* ERROR MESSAGE */}
            {/* ================================= */}

            {error && (

                <div className="error-message">

                    {error}

                </div>

            )}



            {/* ================================= */}
            {/* MATCHING RESULT */}
            {/* ================================= */}

            {result && (

                <div className="match-result">


                    <h2>
                        Matching Result
                    </h2>



                    {result.best_match ? (

                        <div className="tutor-card">


                            {/* ------------------------- */}
                            {/* TUTOR NAME */}
                            {/* ------------------------- */}

                            <h2>
                                {result.best_match.name}
                            </h2>



                            {/* ------------------------- */}
                            {/* QUALIFICATION */}
                            {/* ------------------------- */}

                            <p>

                                <strong>
                                    Qualification:
                                </strong>

                                {" "}

                                {result.best_match.qualification}

                            </p>



                            {/* ------------------------- */}
                            {/* EXPERIENCE */}
                            {/* ------------------------- */}

                            <p>

                                <strong>
                                    Experience:
                                </strong>

                                {" "}

                                {result.best_match.experience}

                                {" "}years

                            </p>



                            {/* ------------------------- */}
                            {/* EXPERTISE */}
                            {/* ------------------------- */}

                            <p>

                                <strong>
                                    Expertise:
                                </strong>

                                {" "}

                                {result.best_match.expertise_level}

                            </p>



                            {/* ------------------------- */}
                            {/* RATING */}
                            {/* ------------------------- */}

                            <p>

                                <strong>
                                    Rating:
                                </strong>

                                {" "}

                                ⭐ {result.best_match.rating}

                            </p>



                            {/* ------------------------- */}
                            {/* PRICE */}
                            {/* ------------------------- */}

                            <p>

                                <strong>
                                    Price:
                                </strong>

                                {" "}

                                ₹{result.best_match.price_per_session}

                            </p>



                            {/* ------------------------- */}
                            {/* MATCH SCORE */}
                            {/* ------------------------- */}

                            <p>

                                <strong>
                                    Match Score:
                                </strong>

                                {" "}

                                {result.best_match.match_score}%

                            </p>



                            {/* ------------------------- */}
                            {/* AVAILABLE SLOT */}
                            {/* ------------------------- */}

                            <p>

                                <strong>
                                    Available:
                                </strong>

                                {" "}

                                {new Date(
                                    result.best_match.available_slot.start_time
                                ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}

                                {" - "}

                                {new Date(
                                    result.best_match.available_slot.end_time
                                ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}

                            </p>



                            {/* ------------------------- */}
                            {/* BOOK TUTOR BUTTON */}
                            {/* ------------------------- */}

                            <button
                                onClick={bookTutor}
                                disabled={bookingLoading}
                            >

                                {bookingLoading
                                    ? "Booking..."
                                    : "Book Tutor"
                                }

                            </button>


                        </div>

                    ) : (

                        <div>

                            <h3>
                                No suitable tutor found.
                            </h3>

                            <p>
                                Try changing the time,
                                budget, or subject.
                            </p>

                        </div>

                    )}

                </div>

            )}



            {/* ================================= */}
            {/* BOOKING CONFIRMATION */}
            {/* ================================= */}

            {bookingResult && (

                <div className="booking-confirmation">

                    <h2>
                        Booking Confirmed! 🎉
                    </h2>


                    <p>

                        <strong>
                            Booking ID:
                        </strong>

                        {" "}

                        {bookingResult.booking_id}

                    </p>


                    <p>

                        <strong>
                            Tutor:
                        </strong>

                        {" "}

                        {result.best_match.name}

                    </p>


                    <p>

                        <strong>
                            Booking Status:
                        </strong>

                        {" "}

                        {bookingResult.booking_status}

                    </p>


                    <p>

                        <strong>
                            Slot Status:
                        </strong>

                        {" "}

                        {bookingResult.slot_status}

                    </p>


                </div>

            )}

        </div>

    );

}


export default StudentDashboard;