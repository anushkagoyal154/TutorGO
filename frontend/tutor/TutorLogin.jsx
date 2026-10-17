
import React, { useState } from "react";

const API_URL = "http://localhost:5000";

function TutorLogin({ onRegister, onLogin, onBack }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const cleanEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
            setError("Please enter a valid registered email.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/tutors/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: cleanEmail,
                        password
                    })
                }
            );

            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(
                    "Backend returned an invalid login response."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Invalid email or password."
                );
            }

            if (!data.tutor) {
                throw new Error(
                    "Login succeeded, but no tutor profile was returned."
                );
            }

            if (!data.token) {
                throw new Error(
                    "Login succeeded, but the backend did not return an authentication token."
                );
            }

            localStorage.setItem("tutorgo_token", data.token);

            onLogin(data.tutor);
        } catch (err) {
            console.error("TUTOR LOGIN ERROR:", err);

            setError(
                err.message || "Unable to log in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card tutor-login-card">
                <button
                    type="button"
                    className="auth-back-button"
                    onClick={onBack}
                    disabled={loading}
                >
                    ← Back
                </button>

                <div className="auth-logo">TutorGo</div>
                <div className="auth-icon">🎓</div>

                <h1>Welcome Back, Tutor</h1>
                <p>Login to access your TutorGo account.</p>

                {error && (
                    <div className="auth-error">
                        <span>✕</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="tutor-email">
                        Email Address
                    </label>
                    <input
                        id="tutor-email"
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="tutor-password">
                        Password
                    </label>
                    <input
                        id="tutor-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="current-password"
                        required
                    />

                    <button
                        type="submit"
                        className="primary-auth-button"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login →"}
                    </button>
                </form>

                <div className="auth-switch">
                    <span>Don't have a TutorGo profile?</span>
                    <button
                        type="button"
                        className="auth-secondary-button"
                        onClick={onRegister}
                        disabled={loading}
                    >
                        Register
                    </button>
                </div>

                <div className="login-info">
                    <span>🔐</span>
                    <p>
                        Use the email and password registered with TutorGo.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TutorLogin;
