import { useEffect, useState } from "react";
import { io } from "socket.io-client";


function TutorDashboard() {

    // ----------------------------------
    // Tutor Information
    // ----------------------------------

    // Temporary tutor ID
    // Rahul Sharma = tutor_id 1

    const tutorId = 1;


    // ----------------------------------
    // Socket State
    // ----------------------------------

    const [connected, setConnected] =
        useState(false);


    // ----------------------------------
    // Request State
    // ----------------------------------

    const [requests, setRequests] =
        useState([]);


    // ----------------------------------
    // Processing State
    // ----------------------------------

    const [processingRequest, setProcessingRequest] =
        useState(null);


    // ----------------------------------
    // Message State
    // ----------------------------------

    const [message, setMessage] =
        useState("");


    // ==================================
    // SOCKET.IO CONNECTION
    // ==================================

    useEffect(() => {

        const socket =
            io("http://localhost:5000");


        // -------------------------------
        // Connected
        // -------------------------------

        socket.on("connect", () => {

            console.log(
                "Connected to TutorGo server:",
                socket.id
            );


            setConnected(true);


            // Register tutor

            socket.emit(
                "registerTutor",
                tutorId
            );

        });


        // -------------------------------
        // Disconnected
        // -------------------------------

        socket.on("disconnect", () => {

            console.log(
                "Disconnected from TutorGo server"
            );


            setConnected(false);

        });


        // -------------------------------
        // New Request
        // -------------------------------

        socket.on(
            "newCoachingRequest",
            (request) => {

                console.log(
                    "New tutoring request:",
                    request
                );


                setRequests(
                    (previousRequests) => [
                        request,
                        ...previousRequests
                    ]
                );

            }
        );


        // -------------------------------
        // Cleanup
        // -------------------------------

        return () => {

            socket.disconnect();

        };

    }, []);


    // ==================================
    // ACCEPT REQUEST
    // ==================================

    const acceptRequest = async (request) => {

        setProcessingRequest(
            request.request_id
        );

        setMessage("");


        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/tutor-requests/${request.request_id}/accept`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            tutor_id: tutorId
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to accept request"
                );

            }


            setMessage(
                `Request ${request.request_id} accepted successfully.`
            );


            // Remove request from incoming list

            setRequests(
                (previousRequests) =>
                    previousRequests.filter(
                        (item) =>
                            item.request_id !==
                            request.request_id
                    )
            );

        }

        catch (error) {

            console.error(error);

            setMessage(error.message);

        }

        finally {

            setProcessingRequest(null);

        }

    };


    // ==================================
    // REJECT REQUEST
    // ==================================

    const rejectRequest = async (request) => {

        setProcessingRequest(
            request.request_id
        );

        setMessage("");


        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/tutor-requests/${request.request_id}/reject`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            tutor_id: tutorId
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to reject request"
                );

            }


            setMessage(
                `Request ${request.request_id} rejected. The slot is available again.`
            );


            // Remove request from list

            setRequests(
                (previousRequests) =>
                    previousRequests.filter(
                        (item) =>
                            item.request_id !==
                            request.request_id
                    )
            );

        }

        catch (error) {

            console.error(error);

            setMessage(error.message);

        }

        finally {

            setProcessingRequest(null);

        }

    };


    // ==================================
    // USER INTERFACE
    // ==================================

    return (

        <div className="tutor-dashboard">


            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <h1>
                Tutor Dashboard
            </h1>


            <p>
                Manage your tutoring requests.
            </p>



            {/* ================================= */}
            {/* CONNECTION STATUS */}
            {/* ================================= */}

            <div>

                <strong>
                    Connection Status:
                </strong>

                {" "}

                {connected
                    ? "🟢 Connected"
                    : "🔴 Disconnected"
                }

            </div>



            {/* ================================= */}
            {/* TUTOR PROFILE */}
            {/* ================================= */}

            <div className="tutor-profile-card">

                <h2>
                    Rahul Sharma
                </h2>


                <p>
                    Tutor ID: {tutorId}
                </p>


                <p>
                    Subjects: DBMS, Operating Systems,
                    Computer Networks
                </p>

            </div>



            {/* ================================= */}
            {/* MESSAGE */}
            {/* ================================= */}

            {message && (

                <div className="message">

                    {message}

                </div>

            )}



            {/* ================================= */}
            {/* INCOMING REQUESTS */}
            {/* ================================= */}

            <div className="requests-section">

                <h2>
                    Incoming Requests
                </h2>


                {requests.length === 0 ? (

                    <div className="no-requests">

                        <p>
                            No new tutoring requests.
                        </p>


                        <p>
                            New requests will appear
                            here in real time.
                        </p>

                    </div>

                ) : (

                    requests.map(
                        (request, index) => (

                            <div
                                className="request-card"
                                key={
                                    request.request_id ||
                                    index
                                }
                            >

                                <h3>
                                    New Tutoring Request
                                </h3>


                                <p>

                                    <strong>
                                        Request ID:
                                    </strong>

                                    {" "}

                                    {request.request_id}

                                </p>


                                <p>

                                    <strong>
                                        Subject:
                                    </strong>

                                    {" "}

                                    {request.subject_name}

                                </p>


                                <p>

                                    <strong>
                                        Topic:
                                    </strong>

                                    {" "}

                                    {request.topic}

                                </p>


                                <p>

                                    <strong>
                                        Preferred Time:
                                    </strong>

                                    {" "}

                                    {request.preferred_time}

                                </p>


                                <p>

                                    <strong>
                                        Budget:
                                    </strong>

                                    {" "}

                                    ₹{request.budget}

                                </p>


                                <p>

                                    <strong>
                                        Mode:
                                    </strong>

                                    {" "}

                                    {request.mode}

                                </p>



                                {/* ------------------------- */}
                                {/* ACCEPT */}
                                {/* ------------------------- */}

                                <button
                                    onClick={() =>
                                        acceptRequest(request)
                                    }
                                    disabled={
                                        processingRequest ===
                                        request.request_id
                                    }
                                >

                                    {processingRequest ===
                                    request.request_id
                                        ? "Processing..."
                                        : "Accept"
                                    }

                                </button>



                                {/* ------------------------- */}
                                {/* REJECT */}
                                {/* ------------------------- */}

                                <button
                                    onClick={() =>
                                        rejectRequest(request)
                                    }
                                    disabled={
                                        processingRequest ===
                                        request.request_id
                                    }
                                >

                                    Reject

                                </button>


                            </div>

                        )
                    )

                )}

            </div>


        </div>

    );

}


export default TutorDashboard;