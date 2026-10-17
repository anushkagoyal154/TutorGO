
import { useState } from "react";

const API_URL = "http://localhost:5000";

function StudentRegister({ onBack, onComplete }) {
    const [step, setStep] = useState(1);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [verificationToken, setVerificationToken] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [name, setName] = useState("");
    const [educationLevel, setEducationLevel] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const cleanEmail = email.trim().toLowerCase();

    async function requestJson(url, body) {
        const response = await fetch(`${API_URL}${url}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error || data.message || "Something went wrong."
            );
        }

        return data;
    }

    // STEP 1: Send OTP to the student's email.
    async function handleSendOtp(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const data = await requestJson(
                "/api/auth/registration/send-otp",
                {
                    role: "student",
                    email: cleanEmail
                }
            );

            setStep(2);
            setMessage(
                data.message ||
                "If this email can be registered, an OTP has been sent."
            );
        } catch (err) {
            setError(err.message || "Could not send the OTP.");
        } finally {
            setLoading(false);
        }
    }

    // STEP 2: Verify the OTP and retain the verification token.
    async function handleVerifyOtp(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!/^\d{6}$/.test(otp.trim())) {
            setError("Enter the six-digit OTP sent to your email.");
            return;
        }

        setLoading(true);

        try {
            const data = await requestJson(
                "/api/auth/registration/verify-otp",
                {
                    role: "student",
                    email: cleanEmail,
                    otp: otp.trim()
                }
            );

            if (!data.verificationToken) {
                throw new Error(
                    "OTP verification succeeded, but no verification token was returned. Please check the backend response."
                );
            }

            setVerificationToken(data.verificationToken);
            setStep(3);
            setMessage("Email verified successfully.");
        } catch (err) {
            setError(err.message || "OTP verification failed.");
        } finally {
            setLoading(false);
        }
    }

    // Resend OTP using the existing backend endpoint.
    async function handleResendOtp() {
        setError("");
        setMessage("");
        setOtp("");
        setLoading(true);

        try {
            const data = await requestJson(
                "/api/auth/registration/send-otp",
                {
                    role: "student",
                    email: cleanEmail
                }
            );

            setMessage(
                data.message ||
                "If the email can be registered, a new OTP has been sent."
            );
        } catch (err) {
            setError(err.message || "Could not resend the OTP.");
        } finally {
            setLoading(false);
        }
    }

    // STEP 3: Check password and confirmation.
    function handlePasswordSubmit(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (password.length < 8 || password.length > 128) {
            setError("Password must contain 8 to 128 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setStep(4);
    }

    // STEP 4: Create the account using the verified email token.
    async function handleCreateAccount(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!verificationToken) {
            setError(
                "Your email verification is missing. Please verify your email again."
            );
            setStep(1);
            return;
        }

        if (!name.trim() || !educationLevel.trim()) {
            setError("Please fill in all the required details.");
            return;
        }

        setLoading(true);

        try {
            const data = await requestJson("/api/students", {
                name: name.trim(),
                email: cleanEmail,
                password,
                education_level: educationLevel.trim(),
                verificationToken
            });

            setMessage("Registration successful. Please log in.");

            // Do not automatically log in after registration.
            if (onComplete) {
                onComplete({
                    student_id: data.student_id,
                    name: data.name || name.trim(),
                    email: data.email || cleanEmail,
                    education_level:
                        data.education_level || educationLevel.trim()
                });
            }
        } catch (err) {
            setError(err.message || "Student registration failed.");
        } finally {
            setLoading(false);
        }
    }

    function goBackOneStep() {
        setError("");
        setMessage("");

        if (step === 1) {
            onBack?.();
        } else if (step === 2) {
            setStep(1);
        } else if (step === 3) {
            setStep(2);
        } else if (step === 4) {
            setStep(3);
        }
    }

    const titles = {
        1: "Create your account",
        2: "Verify your email",
        3: "Create a password",
        4: "Complete your profile"
    };

    const subtitles = {
        1: "Start by entering your email address.",
        2: `Enter the six-digit code sent to ${cleanEmail}.`,
        3: "Choose a strong password for your account.",
        4: "Tell us a little about yourself."
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">✦ TutorGo</div>
                <div className="auth-icon">👩‍🎓</div>

                <div
                    style={{
                        fontSize: "13px",
                        color: "#777",
                        marginBottom: "8px"
                    }}
                >
                    Step {step} of 4
                </div>

                <div
                    style={{
                        height: "5px",
                        background: "#e9e9e9",
                        borderRadius: "10px",
                        marginBottom: "22px",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${step * 25}%`,
                            background: "#6c63ff",
                            transition: "width 0.2s ease"
                        }}
                    />
                </div>

                <h1>{titles[step]}</h1>
                <p className="auth-subtitle">{subtitles[step]}</p>

                {error && (
                    <div className="error-message" role="alert">
                        ❌ {error}
                    </div>
                )}

                {message && (
                    <div
                        role="status"
                        style={{
                            margin: "12px 0",
                            color: "#16803d",
                            fontSize: "14px"
                        }}
                    >
                        {message}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSendOtp}>
                        <label htmlFor="student-register-email">
                            Email address
                        </label>
                        <input
                            id="student-register-email"
                            type="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            className="primary-auth-button"
                            disabled={loading}
                        >
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp}>
                        <label htmlFor="student-register-otp">
                            Six-digit OTP
                        </label>
                        <input
                            id="student-register-otp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) =>
                                setOtp(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6)
                                )
                            }
                            maxLength={6}
                            required
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            className="primary-auth-button"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>

                        <button
                            type="button"
                            className="back-link"
                            onClick={handleResendOtp}
                            disabled={loading}
                        >
                            Resend OTP
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handlePasswordSubmit}>
                        <label htmlFor="student-new-password">
                            Create password
                        </label>
                        <input
                            id="student-new-password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            maxLength={128}
                            required
                        />

                        <label htmlFor="student-confirm-password">
                            Confirm password
                        </label>
                        <input
                            id="student-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Enter the same password again"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            minLength={8}
                            maxLength={128}
                            required
                        />

                        <button
                            type="submit"
                            className="primary-auth-button"
                        >
                            Continue
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <form onSubmit={handleCreateAccount}>
                        <label htmlFor="student-full-name">
                            Full name
                        </label>
                        <input
                            id="student-full-name"
                            type="text"
                            autoComplete="name"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <label htmlFor="student-education-level">
                            Class / Degree / Year
                        </label>
                        <input
                            id="student-education-level"
                            type="text"
                            placeholder="e.g. Class 12, B.Tech CSE 2nd Year"
                            value={educationLevel}
                            onChange={(e) =>
                                setEducationLevel(e.target.value)
                            }
                            required
                        />

                        <small>
                            You can enter any class, course, degree, or year.
                        </small>

                        <button
                            type="submit"
                            className="primary-auth-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Complete Registration"}
                        </button>
                    </form>
                )}

                <button
                    onClick={goBackOneStep}
                    className="back-link"
                    type="button"
                    disabled={loading}
                >
                    {step === 1 ? "← Back to Login" : "← Back"}
                </button>
            </div>
        </div>
    );
}

export default StudentRegister;
