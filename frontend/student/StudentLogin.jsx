import { useState } from "react";


function StudentLogin({ onRegister, onLogin }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        setError("");


        try {

            const response = await fetch(
                `http://localhost:5000/api/students/profile?email=${encodeURIComponent(email)}`
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Student profile not found"
                );

            }


            // Saved profile comes from SQL
            onLogin(data.student);


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
                    Welcome back
                </h1>


                <p className="auth-subtitle">
                    Login to find the right tutor for you.
                </p>


                <form onSubmit={handleSubmit}>


                    {/* EMAIL */}

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your registered email"
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
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
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
                            ? "Loading Profile..."
                            : "Login"}

                    </button>


                </form>


                <div className="auth-divider">
                    <span>OR</span>
                </div>


                <p className="switch-auth">

                    Don't have an account?

                    <button
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