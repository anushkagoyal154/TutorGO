import { useState } from "react";

function StudentDashboard() {

    const [topic, setTopic] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [budget, setBudget] = useState("");
    const [mode, setMode] = useState("Online");

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");


    const findTutor = async (e) => {

        e.preventDefault();

        setLoading(true);
        setError("");
        setResult(null);


        try {

            // -------------------------
            // Step 1: Create Request
            // -------------------------

            const requestResponse = await fetch(
                "http://localhost:5000/api/requests",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        student_id: 1,

                        // DBMS = subject_id 1
                        subject_id: 1,

                        topic: topic,

                        preferred_time:
                            preferredTime.replace("T", " "),

                        budget: budget,

                        mode: mode

                    })
                }
            );


            const requestData =
                await requestResponse.json();


            if (!requestResponse.ok) {

                throw new Error(
                    requestData.error ||
                    "Failed to create request"
                );

            }


            // -------------------------
            // Step 2: Match Tutor
            // -------------------------

            const matchingResponse = await fetch(
                `http://localhost:5000/api/matching/${requestData.request_id}`
            );


            const matchingData =
                await matchingResponse.json();


            if (!matchingResponse.ok) {

                throw new Error(
                    matchingData.error ||
                    "Failed to find tutor"
                );

            }


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


    return (

        <div className="student-dashboard">

            <h1>Student Dashboard</h1>

            <p>
                Find a suitable tutor for your learning needs.
            </p>


            <div className="request-card">

                <h2>Find a Tutor</h2>


                <form onSubmit={findTutor}>

                    {/* Subject */}

                    <label>
                        Subject
                    </label>

                    <select>

                        <option value="1">
                            DBMS
                        </option>

                    </select>


                    {/* Topic */}

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


                    {/* Time */}

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


                    {/* Budget */}

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


                    {/* Mode */}

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


                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Finding Tutor..."
                            : "Find Tutor"}

                    </button>

                </form>


                {/* Error */}

                {error && (

                    <p className="error">
                        {error}
                    </p>

                )}


                {/* Matching Result */}

                {result && (

                    <div className="match-result">

                        <h2>
                            Best Tutor Found
                        </h2>


                        {result.best_match ? (

                            <>

                                <h3>
                                    {result.best_match.name}
                                </h3>

                                <p>
                                    <strong>
                                        Qualification:
                                    </strong>{" "}
                                    {result.best_match.qualification}
                                </p>

                                <p>
                                    <strong>
                                        Experience:
                                    </strong>{" "}
                                    {result.best_match.experience}
                                    {" "}years
                                </p>

                                <p>
                                    <strong>
                                        Expertise:
                                    </strong>{" "}
                                    {result.best_match.expertise_level}
                                </p>

                                <p>
                                    <strong>
                                        Rating:
                                    </strong>{" "}
                                    ⭐ {result.best_match.rating}
                                </p>

                                <p>
                                    <strong>
                                        Price:
                                    </strong>{" "}
                                    ₹{result.best_match.price_per_session}
                                </p>

                                <p>
                                    <strong>
                                        Match Score:
                                    </strong>{" "}
                                    {result.best_match.match_score}%
                                </p>


                                <button>
                                    Book Tutor
                                </button>

                            </>

                        ) : (

                            <p>
                                No suitable tutor found.
                            </p>

                        )}

                    </div>

                )}

            </div>

        </div>

    );

}


export default StudentDashboard;