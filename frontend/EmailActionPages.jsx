
import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/auth";

export function VerifyEmailPage() {
    const [message, setMessage] = useState("Verifying your email...");
    const [error, setError] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const role = params.get("role") || "";
        const token = params.get("token") || "";

        async function verify() {
            try {
                const query = new URLSearchParams({ role, token });
                const response = await fetch(
                    `${API}/verify-email?${query}`
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Email verification failed."
                    );
                }

                setMessage(data.message);
            } catch (err) {
                setError(err.message);
            }
        }

        verify();
    }, []);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">✦ TutorGo</div>
                <h1>Email verification</h1>
                {error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <p>{message}</p>
                )}
            </div>
        </div>
    );
}

export function ForgotPasswordPage({ onBack, initialRole = "student" }) {
    const [role, setRole] = useState(initialRole);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        const cleanEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, email: cleanEmail })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not send reset link.");
            }

            setMessage(data.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">✦ TutorGo</div>
                <h1>Forgot password?</h1>
                <p>Enter your registered email to receive a reset link.</p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="forgot-role">Account type</label>
                    <select
                        id="forgot-role"
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                    >
                        <option value="student">Student</option>
                        <option value="tutor">Tutor</option>
                    </select>

                    <label htmlFor="forgot-email">Email</label>
                    <input
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {message && (
                        <div className="success-message">{message}</div>
                    )}

                    <button
                        type="submit"
                        className="primary-auth-button"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send reset link"}
                    </button>
                </form>

                <button
                    type="button"
                    className="link-button"
                    onClick={onBack}
                >
                    Back to login
                </button>
            </div>
        </div>
    );
}

export function ResetPasswordPage({ onBack }) {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role") || "";
    const token = params.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!["student", "tutor"].includes(role) || !token) {
            setError("Invalid reset link. Request a new one.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, token, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Password reset failed.");
            }

            setMessage(data.message);
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">✦ TutorGo</div>
                <h1>Set a new password</h1>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="new-password">New password</label>
                    <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    <label htmlFor="confirm-password">
                        Confirm new password
                    </label>
                    <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        required
                    />

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {message && (
                        <div className="success-message">{message}</div>
                    )}

                    <button
                        type="submit"
                        className="primary-auth-button"
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Update password"}
                    </button>
                </form>

                <button
                    type="button"
                    className="link-button"
                    onClick={onBack}
                >
                    Back to login
                </button>
            </div>
        </div>
    );
}
