import React, { useState } from "react";


function TutorRegister({
    onBack,
    onLogin,
    onComplete
}) {

    // =========================================
    // FORM STATE
    // =========================================

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [qualification, setQualification] = useState("");
    const [experience, setExperience] = useState("");
    const [price, setPrice] = useState("");
    const [location, setLocation] = useState("");

    const [resume, setResume] = useState(null);


    // =========================================
    // UI STATE
    // =========================================

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =========================================
    // HANDLE RESUME
    // =========================================

    const handleResumeChange = (event) => {

        const file = event.target.files[0];

        if (!file) {
            setResume(null);
            return;
        }


        if (file.type !== "application/pdf") {

            setError(
                "Please select a PDF resume."
            );

            setResume(null);

            return;
        }


        setError("");

        setResume(file);

    };


    // =========================================
    // SUBMIT
    // =========================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        // -----------------------------------------
        // VALIDATION
        // -----------------------------------------

        if (
            !name ||
            !email ||
            !qualification ||
            !experience ||
            !price ||
            !location
        ) {

            setError(
                "Please fill all tutor details."
            );

            return;
        }


        if (!resume) {

            setError(
                "Please upload your PDF resume."
            );

            return;
        }


        setLoading(true);


        try {

            // =====================================
            // STEP 1
            // CREATE TUTOR
            // =====================================

            const tutorResponse = await fetch(
                "http://localhost:5000/api/tutors",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name,
                        email,
                        qualification,

                        experience:
                            Number(experience),

                        price_per_session:
                            Number(price),

                        location

                    })
                }
            );


            const tutorData =
                await tutorResponse.json();


            if (!tutorResponse.ok) {

                throw new Error(
                    tutorData.error ||
                    "Failed to create tutor profile"
                );

            }


            const tutorId =
                tutorData.tutor_id;


            console.log(
                "Tutor created:",
                tutorId
            );


            // =====================================
            // STEP 2
            // UPLOAD RESUME
            // =====================================

            const formData =
                new FormData();


            formData.append(
                "resume",
                resume
            );


            formData.append(
                "tutor_id",
                tutorId
            );


            const resumeResponse =
                await fetch(
                    "http://localhost:5000/api/resume",
                    {
                        method: "POST",

                        body: formData
                    }
                );


            const resumeData =
                await resumeResponse.json();


            if (!resumeResponse.ok) {

                throw new Error(
                    resumeData.error ||
                    "Resume upload failed"
                );

            }


            console.log(
                "Resume parsed:",
                resumeData.parsed_data
            );


            // =====================================
            // STEP 3
            // FETCH UPDATED PROFILE FROM SQL
            // =====================================

            const profileResponse =
                await fetch(
                    `http://localhost:5000/api/tutors/profile?email=${encodeURIComponent(email)}`
                );


            const profileData =
                await profileResponse.json();


            if (!profileResponse.ok) {

                throw new Error(
                    profileData.error ||
                    "Failed to load updated tutor profile"
                );

            }


            console.log(
                "Updated tutor profile:",
                profileData.tutor
            );


            // =====================================
            // STEP 4
            // SEND UPDATED SQL PROFILE
            // TO DASHBOARD
            // =====================================

            setSuccess(
                "Tutor profile and resume saved successfully!"
            );


            onComplete(
                profileData.tutor
            );

        }

        catch (error) {

            console.error(
                "TUTOR REGISTRATION ERROR:",
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


    // =========================================
    // UI
    // =========================================

    return (

        <div className="auth-page">

            <div className="auth-card">


                {/* =================================
                    LOGO
                ================================= */}

                <div className="auth-logo">
                    TutorGo
                </div>


                <div className="auth-icon">
                    🧑‍🏫
                </div>


                <h1>
                    Become a Tutor
                </h1>


                <p>
                    Create your tutor profile and
                    upload your resume.
                </p>


                {/* =================================
                    ERROR
                ================================= */}

                {error && (

                    <div className="error-message">

                        ❌ {error}

                    </div>

                )}


                {/* =================================
                    SUCCESS
                ================================= */}

                {success && (

                    <div className="success-message">

                        ✓ {success}

                    </div>

                )}


                {/* =================================
                    FORM
                ================================= */}

                <form
                    onSubmit={handleSubmit}
                >


                    {/* NAME */}

                    <label>
                        Full Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                    />


                    {/* EMAIL */}

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />


                    {/* PASSWORD */}

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />


                    {/* QUALIFICATION */}

                    <label>
                        Qualification
                    </label>

                    <input
                        type="text"
                        placeholder="e.g. M.Tech Computer Science"
                        value={qualification}
                        onChange={(e) =>
                            setQualification(
                                e.target.value
                            )
                        }
                    />


                    {/* EXPERIENCE */}

                    <label>
                        Teaching Experience (Years)
                    </label>

                    <input
                        type="number"
                        min="0"
                        placeholder="e.g. 5"
                        value={experience}
                        onChange={(e) =>
                            setExperience(
                                e.target.value
                            )
                        }
                    />


                    {/* PRICE */}

                    <label>
                        Price Per Session (₹)
                    </label>

                    <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={price}
                        onChange={(e) =>
                            setPrice(
                                e.target.value
                            )
                        }
                    />


                    {/* LOCATION */}

                    <label>
                        Location
                    </label>

                    <input
                        type="text"
                        placeholder="e.g. Chandigarh"
                        value={location}
                        onChange={(e) =>
                            setLocation(
                                e.target.value
                            )
                        }
                    />


                    {/* RESUME */}

                    <label>
                        Resume (PDF)
                    </label>

                    <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={
                            handleResumeChange
                        }
                    />


                    {/* SELECTED FILE */}

                    {resume && (

                        <div
                            style={{
                                marginTop: "5px",
                                padding: "10px",
                                borderRadius: "9px",
                                background: "#f5f6ff",
                                color: "#4f46e5",
                                fontSize: "13px"
                            }}
                        >

                            📄 Selected:{" "}
                            {resume.name}

                        </div>

                    )}


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="primary-auth-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Creating Profile..."
                            : "Create Tutor Profile →"}

                    </button>


                </form>


                {/* =================================
                    LOGIN
                ================================= */}

                <div className="back-link">

                    Already have an account?

                    {" "}

                    <button
                        type="button"
                        className="link-button"
                        onClick={onLogin}
                    >
                        Login
                    </button>

                </div>


                {/* =================================
                    BACK
                ================================= */}

                <div
                    className="back-link"
                    onClick={onBack}
                >
                    ← Back
                </div>


            </div>

        </div>

    );

}


export default TutorRegister;