import { useState } from "react";


function StudentRegister({ onBack, onComplete }) {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        setError("");


        try {

            const response = await fetch(
                "http://localhost:5000/api/students",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to create student profile"
                );

            }


            // Save profile returned from backend
            onComplete({

                student_id: data.student_id,

                name: name,

                email: email

            });


        } catch (err) {

            console.error(err);

            setError(err.message);

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-page">

            <div className="auth-card">


                {/* Logo */}

                <div className="auth-logo">
                    ✦ TutorGo
                </div>


                {/* Icon */}

                <div className="auth-icon">
                    👩‍🎓
                </div>


                <h1>
                    Create your profile
                </h1>


                <p className="auth-subtitle">
                    Tell us a little about yourself.
                </p>


                <form onSubmit={handleSubmit}>


                    {/* NAME */}

                    <label>
                        Full Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        required
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
                        required
                    />


                    {/* PASSWORD */}

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Create a password"
                    />


                    {/* CLASS */}

                    <label>
                        Class / Year
                    </label>

                    <input
                        type="text"
                        placeholder="e.g. B.Tech 2nd Year"
                    />


                    {error && (

                        <div className="error-message">
                            ❌ {error}
                        </div>

                    )}


                    <button
                        type="submit"
                        className="primary-auth-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Creating Profile..."
                            : "Create Student Profile"}

                    </button>


                </form>


                <button
                    onClick={onBack}
                    className="back-link"
                >
                    ← Back to Login
                </button>


            </div>

        </div>

    );

}


export default StudentRegister;