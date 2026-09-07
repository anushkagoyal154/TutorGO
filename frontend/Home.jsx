import { useState } from "react";

import StudentDashboard from "./student/StudentDashboard";
import TutorDashboard from "./tutor/TutorDashboard";


function Home() {

    const [role, setRole] = useState(null);


    // -------------------------------
    // Student Dashboard
    // -------------------------------

    if (role === "student") {

        return (

            <div>

                <button
                    onClick={() => setRole(null)}
                >
                    ← Back
                </button>

                <StudentDashboard />

            </div>

        );

    }


    // -------------------------------
    // Tutor Dashboard
    // -------------------------------

    if (role === "tutor") {

        return (

            <div>

                <button
                    onClick={() => setRole(null)}
                >
                    ← Back
                </button>

                <TutorDashboard />

            </div>

        );

    }


    // -------------------------------
    // Role Selection
    // -------------------------------

    return (

        <div className="home-page">

            <h1>
                TutorGo
            </h1>

            <p>
                Intelligent Tutor Matching and Scheduling
            </p>


            <h2>
                Continue as
            </h2>


            <button
                onClick={() => setRole("student")}
            >
                Student
            </button>


            <button
                onClick={() => setRole("tutor")}
            >
                Tutor
            </button>

        </div>

    );

}


export default Home;