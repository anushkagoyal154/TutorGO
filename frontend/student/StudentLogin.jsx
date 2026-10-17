
import { useState } from "react";

const API_URL = "http://localhost:5000";

function StudentLogin({ onRegister, onLogin, onForgotPassword }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const cleanEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/students/login`,
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

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error || "Invalid email or password."
                );
            }

            if (!data.student) {
                throw new Error("Student profile was not returned.");
            }

            if (!data.token) {
                throw new Error("Login succeeded without an authentication token.");
            }

            // Store the JWT for authenticated API requests.
            localStorage.setItem("tutorgo_token", data.token);

            onLogin(data.student);
        } catch (err) {
            setError(err.message || "Unable to log in.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">✦ TutorGo</div>
                <div className="auth-icon">👩‍🎓</div>

                <h1>Welcome back</h1>

                <p className="auth-subtitle">
                    Login to find the right tutor for you.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="student-email">Email</label>
                    <input
                        id="student-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label htmlFor="student-password">Password</label>
                    <input
                        id="student-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <div
                        style={{
                            textAlign: "right",
                            margin: "8px 0 16px"
                        }}
                    >
                        <button
                            type="button"
                            className="link-button"
                            onClick={() => {
                                if (onForgotPassword) {
                                    onForgotPassword();
                                } else {
                                    setError(
                                        "Forgot password navigation is not configured."
                                    );
                                }
                            }}
                        >
                            Forgot password?
                        </button>
                    </div>

                    {error && (
                        <div className="error-message" role="alert">
                            ❌ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-auth-button"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR</span>
                </div>

                <p className="switch-auth">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={onRegister}
                        className="link-button"
                    >
                        Create one
                    </button>
                </p>
            </div>
        </div>
    );
}

export default StudentLogin;
