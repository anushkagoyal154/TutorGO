
import { useState } from "react";

import StudentDashboard from "./student/StudentDashboard";
import StudentLogin from "./student/StudentLogin";
import StudentRegister from "./student/StudentRegister";

import TutorDashboard from "./tutor/TutorDashboard";
import TutorLogin from "./tutor/TutorLogin";
import TutorRegister from "./tutor/TutorRegister";

import {
    ForgotPasswordPage,
    VerifyEmailPage,
    ResetPasswordPage,
} from "./EmailActionPages";

import "./App.css";



const getSavedProfile = () => {
    try {
        const savedProfile = localStorage.getItem("tutorgo_profile");
        return savedProfile ? JSON.parse(savedProfile) : null;
    } catch (error) {
        console.error("Failed to load saved profile:", error);
        return null;
    }
};

const getSavedRole = () => {
    return localStorage.getItem("tutorgo_role");
};


function Home() {
    const savedProfile = getSavedProfile();
    const savedRole = getSavedRole();

    const [role, setRole] = useState(savedRole || null);

    const [screen, setScreen] = useState(
        savedRole && savedProfile ? "dashboard" : "login"
    );

    const [profile, setProfile] = useState(savedProfile);



    const saveSession = (selectedRole, data) => {
        setRole(selectedRole);
        setProfile(data);
        setScreen("dashboard");

        localStorage.setItem("tutorgo_role", selectedRole);
        localStorage.setItem("tutorgo_profile", JSON.stringify(data));

       
    };

    

    const goToHome = () => {
        setRole(null);
        setScreen("login");
        setProfile(null);

        localStorage.removeItem("tutorgo_role");
        localStorage.removeItem("tutorgo_profile");
        localStorage.removeItem("tutorgo_token");
    };

    

    const returnToLogin = () => {
        setScreen("login");
    };

    

    const currentPath = window.location.pathname;

    if (currentPath === "/verify-email") {
        return <VerifyEmailPage />;
    }

    

    if (currentPath === "/reset-password") {
        return (
            <ResetPasswordPage
                onBack={() => {
                    window.history.replaceState({}, "", "/");
                    goToHome();
                }}
            />
        );
    }


    if (screen === "forgot-password") {
        return (
            <ForgotPasswordPage
                initialRole={role === "tutor" ? "tutor" : "student"}
                onBack={returnToLogin}
            />
        );
    }

    

    if (role === "student") {
        // Student dashboard
        if (screen === "dashboard") {
            return (
                <div>
                    <button
                        type="button"
                        className="dashboard-home-button"
                        onClick={goToHome}
                    >
                        ← Home
                    </button>

                    <StudentDashboard
                        profile={profile}
                        onLogout={goToHome}
                    />
                </div>
            );
        }

        // Student registration
        if (screen === "register") {
            return (
                <StudentRegister
                    onBack={returnToLogin}
                    onComplete={returnToLogin}
                />
            );
        }

        // Student login
        return (
            <StudentLogin
                onRegister={() => setScreen("register")}
                onForgotPassword={() => setScreen("forgot-password")}
                onLogin={(data) => saveSession("student", data)}
            />
        );
    }

    

    if (role === "tutor") {
        // Tutor dashboard
        if (screen === "dashboard") {
            return (
                <div>
                    <button
                        type="button"
                        className="dashboard-home-button"
                        onClick={goToHome}
                    >
                        ← Home
                    </button>

                    <TutorDashboard
                        profile={profile}
                        onLogout={goToHome}
                    />
                </div>
            );
        }

        // Tutor registration
        if (screen === "register") {
            return (
                <TutorRegister
                    onBack={returnToLogin}
                    onLogin={returnToLogin}
                    onComplete={returnToLogin}
                />
            );
        }

        // Tutor login
        return (
            <TutorLogin
                onRegister={() => setScreen("register")}
                onBack={goToHome}
                onForgotPassword={() => setScreen("forgot-password")}
                onLogin={(data) => saveSession("tutor", data)}
            />
        );
    }

    

    return (
        <div className="home-page">
            {/* NAVBAR */}
            <nav className="navbar">
                <div className="logo">TutorGo</div>

                <div className="nav-tagline">
                    Intelligent Tutor Matching
                </div>
            </nav>

            {/* HERO */}
            <section className="hero-section">
                <h1>
                    The right tutor,
                    <br />
                    <span>right when you need one.</span>
                </h1>

                <p>
                    TutorGo connects students with suitable tutors based
                    on subject, expertise, availability, budget, rating
                    and more.
                </p>
            </section>

            {/* ROLE SELECTION */}
            <section className="role-section">
                <h2>How would you like to continue?</h2>

                <div className="role-cards">
                    {/* STUDENT */}
                    <div
                        className="role-card student-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            setRole("student");
                            setScreen("login");
                            setProfile(null);
                        }}
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {
                                event.preventDefault();
                                setRole("student");
                                setScreen("login");
                                setProfile(null);
                            }
                        }}
                    >
                        <div className="role-icon">🎓</div>

                        <h3>I am a Student</h3>

                        <p>
                            Find a tutor for your subject and topic.
                        </p>

                        <div className="role-arrow">→</div>
                    </div>

                    {/* TUTOR */}
                    <div
                        className="role-card tutor-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            setRole("tutor");
                            setScreen("login");
                            setProfile(null);
                        }}
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {
                                event.preventDefault();
                                setRole("tutor");
                                setScreen("login");
                                setProfile(null);
                            }
                        }}
                    >
                        <div className="role-icon">🧑‍🏫</div>

                        <h3>I am a Tutor</h3>

                        <p>
                            Share your expertise and teach students.
                        </p>

                        <div className="role-arrow">→</div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <div className="feature-strip">
                <div className="feature-item">
                    <div className="feature-icon">⚡</div>
                    <h3>Quick Matching</h3>
                </div>

                <div className="feature-item">
                    <div className="feature-icon">🎯</div>
                    <h3>Smart Ranking</h3>
                </div>

                <div className="feature-item">
                    <div className="feature-icon">🔒</div>
                    <h3>Secure Booking</h3>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="home-footer">
                TutorGo • Intelligent Tutor Matching Platform
            </footer>
        </div>
    );
}

export default Home;
