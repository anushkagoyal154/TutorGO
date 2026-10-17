
import React, { useState } from "react";

const API_URL = "http://localhost:5000";

async function requestJson(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const text = await response.text();
    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Backend returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            "Request failed. Please try again."
        );
    }

    return data;
}

function TutorRegister({ onBack, onLogin, onComplete }) {
    const [step, setStep] = useState(1);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [verificationToken, setVerificationToken] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [name, setName] = useState("");
    const [qualification, setQualification] = useState("");
    const [experience, setExperience] = useState("");
    const [price, setPrice] = useState("");
    const [location, setLocation] = useState("");
    const [resume, setResume] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const handleSendOtp = async () => {
        setError("");
        setMessage("");

        const cleanEmail = email.trim().toLowerCase();

        if (!validEmail.test(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const data = await requestJson(
                `${API_URL}/api/auth/registration/send-otp`,
                {
                    role: "tutor",
                    email: cleanEmail
                }
            );

            setEmail(cleanEmail);
            setStep(2);
            setMessage(data.message || "OTP sent to your email.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError("");
        setMessage("");

        if (!/^\d{6}$/.test(otp.trim())) {
            setError("Enter the six-digit OTP sent to your email.");
            return;
        }

        setLoading(true);

        try {
            const data = await requestJson(
                `${API_URL}/api/auth/registration/verify-otp`,
                {
                    role: "tutor",
                    email: email.trim().toLowerCase(),
                    otp: otp.trim()
                }
            );

            if (!data.verificationToken) {
                throw new Error(
                    "Email verified, but the verification token was not returned."
                );
            }

            setVerificationToken(data.verificationToken);
            setStep(3);
            setMessage("Email verified successfully.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setMessage("");
        setOtp("");

        setLoading(true);

        try {
            const data = await requestJson(
                `${API_URL}/api/auth/registration/send-otp`,
                {
                    role: "tutor",
                    email: email.trim().toLowerCase()
                }
            );

            setMessage(data.message || "A new OTP has been sent.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordContinue = () => {
        setError("");
        setMessage("");

        if (password.length < 8 || password.length > 128) {
            setError("Password must be between 8 and 128 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setStep(4);
    };

    const handleResumeChange = (event) => {
        const file = event.target.files?.[0];

        setError("");
        setResume(null);

        if (!file) return;

        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            setError("Please select a PDF resume.");
            event.target.value = "";
            return;
        }

        setResume(file);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        if (!verificationToken) {
            setError("Please verify your email before registering.");
            setStep(1);
            return;
        }

        if (
            !name.trim() ||
            !qualification.trim() ||
            experience === "" ||
            price === "" ||
            !location.trim()
        ) {
            setError("Please fill in all tutor profile details.");
            return;
        }

        if (
            !Number.isFinite(Number(experience)) ||
            Number(experience) < 0
        ) {
            setError("Experience must be a valid non-negative number.");
            return;
        }

        if (
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            setError("Price must be a valid non-negative number.");
            return;
        }

        if (!resume) {
            setError("Please upload your PDF resume.");
            return;
        }

        setLoading(true);

        let tutorCreated = false;

        try {
            // STEP 1: Create the tutor account using the verified token.
            const tutorData = await requestJson(
                `${API_URL}/api/tutors`,
                {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    qualification: qualification.trim(),
                    experience: Number(experience),
                    price_per_session: Number(price),
                    location: location.trim(),
                    verificationToken
                }
            );

            const tutorId = tutorData.tutor_id;

            if (!tutorId) {
                throw new Error(
                    "Tutor account was created, but no tutor ID was returned."
                );
            }

            tutorCreated = true;

            // STEP 2: Upload the PDF resume.
            const formData = new FormData();
            formData.append("resume", resume);
            formData.append("tutor_id", String(tutorId));

            const resumeResponse = await fetch(
                `${API_URL}/api/resume`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const resumeText = await resumeResponse.text();
            let resumeData;

            try {
                resumeData = JSON.parse(resumeText);
            } catch {
                throw new Error(
                    "The account was created, but the resume upload returned an invalid response."
                );
            }

            if (!resumeResponse.ok) {
                throw new Error(
                    resumeData.error ||
                    "The account was created, but resume upload failed."
                );
            }

            console.log(
                "Resume processing result:",
                resumeData.parsed_data
            );

            // STEP 3: Load the saved tutor profile.
            const profileResponse = await fetch(
                `${API_URL}/api/tutors/profile?email=${encodeURIComponent(
                    email.trim().toLowerCase()
                )}`
            );

            const profileText = await profileResponse.text();
            let profileData;

            try {
                profileData = JSON.parse(profileText);
            } catch {
                throw new Error(
                    "The account and resume were saved, but the profile response was invalid."
                );
            }

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.error ||
                    "The account was created, but the profile could not be loaded."
                );
            }

            setMessage(
                "Tutor registration completed successfully. Please log in."
            );

            // Do not automatically log the tutor in.
            // Home.jsx should take the user back to tutor login.
            if (onComplete) {
                onComplete(profileData.tutor);
            }
        } catch (err) {
            console.error("TUTOR REGISTRATION ERROR:", err);

            if (tutorCreated) {
                setError(
                    `${err.message} Your tutor account may already exist. Do not submit registration again with the same email; try logging in or check the resume/profile in the backend first.`
                );
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">TutorGo</div>
                <div className="auth-icon">🧑‍🏫</div>

                <h1>Become a Tutor</h1>
                <p>
                    Verify your email and create your tutor profile.
                </p>

                <div style={{ margin: "20px 0" }}>
                    <strong>Step {step} of 4</strong>
                    <div
                        style={{
                            height: "6px",
                            background: "#e5e7eb",
                            borderRadius: "8px",
                            marginTop: "8px",
                            overflow: "hidden"
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${step * 25}%`,
                                background: "#4f46e5",
                                transition: "width 0.2s"
                            }}
                        />
                    </div>

                    <small>
                        {[
                            "Email address",
                            "Email verification",
                            "Create password",
                            "Tutor profile"
                        ][step - 1]}
                    </small>
                </div>

                {error && (
                    <div className="auth-error">
                        ❌ {error}
                    </div>
                )}

                {message && (
                    <div className="success-message">
                        ✓ {message}
                    </div>
                )}

                {step === 1 && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendOtp();
                        }}
                    >
                        <label htmlFor="tutor-register-email">
                            Email Address
                        </label>
                        <input
                            id="tutor-register-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            autoComplete="email"
                            disabled={loading}
                            required
                        />

                        <button
                            type="submit"
                            className="primary-auth-button"
                            disabled={loading}
                        >
                            {loading ? "Sending OTP..." : "Send OTP →"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div>
                        <p>
                            Enter the six-digit code sent to{" "}
                            <strong>{email}</strong>.
                        </p>

                        <label htmlFor="tutor-register-otp">
                            Email OTP
                        </label>
                        <input
                            id="tutor-register-otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(e) =>
                                setOtp(
                                    e.target.value.replace(/\D/g, "").slice(0, 6)
                                )
                            }
                            placeholder="Enter 6-digit OTP"
                            disabled={loading}
                        />

                        <button
                            type="button"
                            className="primary-auth-button"
                            onClick={handleVerifyOtp}
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify Email →"}
                        </button>

                        <button
                            type="button"
                            className="link-button"
                            onClick={handleResendOtp}
                            disabled={loading}
                        >
                            Resend OTP
                        </button>

                        <button
                            type="button"
                            className="link-button"
                            onClick={() => {
                                setError("");
                                setMessage("");
                                setStep(1);
                            }}
                            disabled={loading}
                        >
                            Change email
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handlePasswordContinue();
                        }}
                    >
                        <label htmlFor="tutor-new-password">
                            Create Password
                        </label>
                        <input
                            id="tutor-new-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={128}
                            placeholder="At least 8 characters"
                            disabled={loading}
                            required
                        />

                        <label htmlFor="tutor-confirm-password">
                            Confirm Password
                        </label>
                        <input
                            id="tutor-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={128}
                            placeholder="Re-enter your password"
                            disabled={loading}
                            required
                        />

                        <button
                            type="submit"
                            className="primary-auth-button"
                            disabled={loading}
                        >
                            Continue to Profile →
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <form onSubmit={handleSubmit}>
                        <p>
                            Verified email: <strong>{email}</strong>
                        </p>

                        <label htmlFor="tutor-name">Full Name</label>
                        <input
                            id="tutor-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            disabled={loading}
                            required
                        />

                        <label htmlFor="tutor-qualification">
                            Qualification
                        </label>
                        <input
                            id="tutor-qualification"
                            type="text"
                            value={qualification}
                            onChange={(e) =>
                                setQualification(e.target.value)
                            }
                            placeholder="e.g. M.Tech Computer Science"
                            disabled={loading}
                            required
                        />

                        <label htmlFor="tutor-experience">
                            Teaching Experience (Years)
                        </label>
                        <input
                            id="tutor-experience"
                            type="number"
                            min="0"
                            step="any"
                            value={experience}
                            onChange={(e) =>
                                setExperience(e.target.value)
                            }
                            placeholder="e.g. 5"
                            disabled={loading}
                            required
                        />

                        <label htmlFor="tutor-price">
                            Price Per Session (₹)
                        </label>
                        <input
                            id="tutor-price"
                            type="number"
                            min="0"
                            step="any"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="e.g. 500"
                            disabled={loading}
                            required
                        />

                        <label htmlFor="tutor-location">Location</label>
                        <input
                            id="tutor-location"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter your location"
                            disabled={loading}
                            required
                        />

                        <label htmlFor="tutor-resume">
                            Resume (PDF)
                        </label>
                        <input
                            id="tutor-resume"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleResumeChange}
                            disabled={loading}
                            required
                        />

                        {resume && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    padding: "10px",
                                    borderRadius: "9px",
                                    background: "#f5f6ff",
                                    color: "#4f46e5",
                                    fontSize: "13px"
                                }}
                            >
                                📄 Selected: {resume.name}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="primary-auth-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Tutor Profile..."
                                : "Complete Registration →"}
                        </button>
                    </form>
                )}

                <div className="back-link">
                    Already have an account?{" "}
                    <button
                        type="button"
                        className="link-button"
                        onClick={onLogin}
                        disabled={loading}
                    >
                        Login
                    </button>
                </div>

                <div className="back-link">
                    <button
                        type="button"
                        className="link-button"
                        onClick={onBack}
                        disabled={loading}
                    >
                        ← Back
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TutorRegister;
