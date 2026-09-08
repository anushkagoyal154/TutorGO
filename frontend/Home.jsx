import { useState } from "react";

import StudentDashboard from "./student/StudentDashboard";
import StudentLogin from "./student/StudentLogin";
import StudentRegister from "./student/StudentRegister";

import TutorDashboard from "./tutor/TutorDashboard";
import TutorLogin from "./tutor/TutorLogin";
import TutorRegister from "./tutor/TutorRegister";


function Home() {

    const [role, setRole] = useState(null);

    const [screen, setScreen] = useState("login");

    const [profile, setProfile] = useState(null);


    /* =====================================================
       STUDENT
       ===================================================== */

    if (role === "student") {

        /* -----------------------------
           STUDENT DASHBOARD
           ----------------------------- */

        if (screen === "dashboard") {

            return (
                <div>

                    <button
                        className="dashboard-home-button"
                        onClick={() => {
                            setRole(null);
                            setScreen("login");
                            setProfile(null);
                        }}
                    >
                        ← Home
                    </button>

                    <StudentDashboard
                        profile={profile}
                    />

                </div>
            );
        }


        /* -----------------------------
           STUDENT REGISTER
           ----------------------------- */

        if (screen === "register") {

            return (
                <StudentRegister
                    onBack={() => setScreen("login")}

                    onComplete={(data) => {

                        setProfile(data);

                        setScreen("dashboard");

                    }}
                />
            );
        }


        /* -----------------------------
           STUDENT LOGIN
           ----------------------------- */

        return (
            <StudentLogin

                onRegister={() => {
                    setScreen("register");
                }}

                onLogin={(data) => {

                    setProfile(data);

                    setScreen("dashboard");

                }}
            />
        );
    }



    /* =====================================================
       TUTOR
       ===================================================== */

    if (role === "tutor") {

        /* -----------------------------
           TUTOR DASHBOARD
           ----------------------------- */

        if (screen === "dashboard") {

            return (
                <div>

                    <button
                        className="dashboard-home-button"
                        onClick={() => {

                            setRole(null);

                            setScreen("login");

                            setProfile(null);

                        }}
                    >
                        ← Home
                    </button>

                    <TutorDashboard
                        profile={profile}
                    />

                </div>
            );
        }


        /* -----------------------------
           TUTOR REGISTER
           ----------------------------- */

        if (screen === "register") {

            return (
                <TutorRegister

                    onBack={() => {
                        setScreen("login");
                    }}

                    onLogin={() => {
                        setScreen("login");
                    }}

                    onComplete={(data) => {

                        setProfile(data);

                        setScreen("dashboard");

                    }}
                />
            );
        }


        /* -----------------------------
           TUTOR LOGIN
           ----------------------------- */

        return (
            <TutorLogin

                onRegister={() => {
                    setScreen("register");
                }}

                onBack={() => {

                    setRole(null);

                    setScreen("login");

                }}

                onLogin={(data) => {

                    setProfile(data);

                    setScreen("dashboard");

                }}
            />
        );
    }



    /* =====================================================
       HOME LANDING PAGE
       ===================================================== */

    return (

        <div className="home-page">


            {/* =========================================
                NAVBAR
                ========================================= */}

            <nav className="navbar">

                <div className="logo">
                    TutorGo
                </div>

                <div className="nav-tagline">
                    Intelligent Tutor Matching
                </div>

            </nav>



            {/* =========================================
                HERO
                ========================================= */}

            <section className="hero-section">

                <h1>
                    The right tutor,
                    <br />

                    <span>
                        right when you need one.
                    </span>
                </h1>


                <p>
                    TutorGo connects students with suitable
                    tutors based on subject, expertise,
                    availability, budget, rating and more.
                </p>

            </section>



            {/* =========================================
                ROLE SELECTION
                ========================================= */}

            <section className="role-section">

                <h2>
                    How would you like to continue?
                </h2>


                <div className="role-cards">


                    {/* =================================
                        STUDENT
                        ================================= */}

                    <div
                        className="role-card student-card"

                        onClick={() => {

                            setRole("student");

                            setScreen("login");

                        }}
                    >

                        <div className="role-icon">
                            🎓
                        </div>


                        <h3>
                            I am a Student
                        </h3>


                        <p>
                            Find a tutor for your subject
                            and topic.
                        </p>


                        <div className="role-arrow">
                            →
                        </div>

                    </div>



                    {/* =================================
                        TUTOR
                        ================================= */}

                    <div
                        className="role-card tutor-card"

                        onClick={() => {

                            setRole("tutor");

                            setScreen("login");

                        }}
                    >

                        <div className="role-icon">
                            🧑‍🏫
                        </div>


                        <h3>
                            I am a Tutor
                        </h3>


                        <p>
                            Share your expertise and
                            teach students.
                        </p>


                        <div className="role-arrow">
                            →
                        </div>

                    </div>

                </div>

            </section>



            {/* =========================================
                FEATURES
                ========================================= */}

            <div className="feature-strip">


                {/* QUICK MATCHING */}

                <div className="feature-item">

                    <div className="feature-icon">
                        ⚡
                    </div>

                    <h3>
                        Quick Matching
                    </h3>
                </div>



                {/* SMART RANKING */}

                <div className="feature-item">

                    <div className="feature-icon">
                        🎯
                    </div>

                    <h3>
                        Smart Ranking
                    </h3>
                </div>



                {/* SECURE BOOKING */}

                <div className="feature-item">

                    <div className="feature-icon">
                        🔒
                    </div>

                    <h3>
                        Secure Booking
                    </h3>

                </div>

            </div>



            {/* =========================================
                FOOTER
                ========================================= */}

            <footer className="home-footer">

                TutorGo
                {" "}•{" "}
                Intelligent Tutor Matching Platform

            </footer>

        </div>
    );
}


export default Home;