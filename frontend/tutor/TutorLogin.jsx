import React, { useState } from "react";

function TutorLogin({
    onRegister,
    onLogin,
    onBack
}) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    // =========================================
    // LOGIN
    // =========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!email) {
            setError("Please enter your registered email.");
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                `http://localhost:5000/api/tutors/profile?email=${encodeURIComponent(email)}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Tutor profile not found."
                );
            }

            console.log(
                "Tutor profile loaded:",
                data.tutor
            );

            onLogin(data.tutor);

        } catch (error) {

            console.error(
                "TUTOR LOGIN ERROR:",
                error
            );

            setError(error.message);

        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="auth-page">

            <div className="auth-card tutor-login-card">


                {/* =====================================
                    BACK
                ===================================== */}

                <button
                    type="button"
                    className="auth-back-button"
                    onClick={onBack}
                >
                    ← Back
                </button>


                {/* =====================================
                    BRAND
                ===================================== */}

                <div className="auth-logo">
                    TutorGo
                </div>


                <div className="auth-icon">
                    🎓
                </div>


                {/* =====================================
                    HEADING
                ===================================== */}

                <h1>
                    Welcome Back, Tutor
                </h1>

                <p>
                    Login to access your saved TutorGo profile.
                </p>


                {/* =====================================
                    ERROR
                ===================================== */}

                {error && (

                    <div className="auth-error">

                        <span>
                            ✕
                        </span>

                        {error}

                    </div>

                )}


                {/* =====================================
                    FORM
                ===================================== */}

                <form onSubmit={handleSubmit}>


                    {/* EMAIL */}

                    <label htmlFor="tutor-email">
                        Email Address
                    </label>

                    <input
                        id="tutor-email"
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />


                    {/* PASSWORD */}

                    <label htmlFor="tutor-password">
                        Password
                    </label>

                    <input
                        id="tutor-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />


                    {/* LOGIN */}

                    <button
                        type="submit"
                        className="primary-auth-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Loading Profile..."
                            : "Login →"
                        }

                    </button>

                </form>


                {/* =====================================
                    REGISTER
                ===================================== */}

                <div className="auth-switch">

                    <span>
                        Don't have a TutorGo profile?
                    </span>

                    <button
                        type="button"
                        className="auth-secondary-button"
                        onClick={onRegister}
                    >
                        Register
                    </button>

                </div>


                {/* =====================================
                    INFORMATION
                ===================================== */}

                <div className="login-info">

                    <span>
                        🔐
                    </span>

                    <p>
                        Your saved tutor profile will
                        be loaded from TutorGo.
                    </p>

                </div>


            </div>

        </div>

    );
}

export default TutorLogin;