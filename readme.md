# TutorGo — Intelligent On-Demand Tutor Matching and Scheduling Platform

TutorGo is a web-based tutoring platform designed to connect students with suitable tutors through a centralized system. It simplifies tutor discovery, profile management, availability tracking, session booking, payments, and feedback through separate Student and Tutor portals.

The platform uses a React frontend, a Node.js and Express.js backend, and a MySQL relational database. It also incorporates Socket.IO for real-time updates and a resume parser to support tutor information extraction.

## ✨ Key Features

- **User Authentication:** Student and tutor registration, login, and profile management.
- **Student Portal:** Search for tutors based on subjects and requirements.
- **Tutor Discovery & Matching:** Help students find suitable tutors.
- **Availability Management:** Allow tutors to manage their availability.
- **Session Booking:** Enable students to book tutoring sessions.
- **Payment Management:** Support the payment workflow for booked sessions.
- **Feedback System:** Allow students to submit feedback after sessions.
- **Real-Time Updates:** Use Socket.IO for event-driven communication and session status updates.
- **Resume Parser:** Support tutor information extraction for profile creation.
- **Relational Database:** Use MySQL to maintain structured records and relationships.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js |
| Backend Framework | Express.js |
| Database | MySQL |
| API Communication | REST APIs (HTTP/JSON) |
| Real-Time Communication | Socket.IO |
| Resume Processing | Resume Parser |
| Version Control | Git and GitHub |

## 🏗️ System Architecture

TutorGo follows a client-server architecture with separate frontend and backend components.

1. **Frontend:** React provides separate interfaces for students and tutors.
2. **REST API Layer:** HTTP requests and JSON responses facilitate communication between the frontend and backend.
3. **Backend:** Node.js and Express.js handle authentication, tutor matching, bookings, payments, feedback, and other application logic.
4. **Database:** MySQL stores user profiles, tutor information, availability, bookings, payment records, and related data.
5. **Real-Time Layer:** Socket.IO supports live updates and event-driven communication.

### Application Workflow

Student/Tutor → React Portal → REST APIs → Express.js Backend → MySQL Database

Socket.IO supports real-time events, while the resume parser assists with tutor information extraction.

## 📂 Project Modules

### 1. User Management
- Student and tutor registration.
- Login and authentication.
- Profile creation and management.

### 2. Tutor Search and Matching
- Search tutors by subject and requirements.
- Retrieve relevant tutor information.
- Support the tutor discovery process.

### 3. Availability and Session Booking
- Manage tutor availability.
- Book tutoring sessions.
- Maintain booking and session status.

### 4. Payments and Feedback
- Support payment workflows.
- Maintain payment-related records.
- Collect feedback associated with completed sessions.

### 5. Resume Parser
- Extract relevant information from tutor resumes.
- Support tutor profile creation and information management.

## 🗄️ Database and DBMS Concepts

MySQL is used as the relational database management system.

The project applies the following DBMS concepts:

- **Relational Schema Design:** Organizing application data into structured tables.
- **Primary and Foreign Keys:** Establishing relationships between related records.
- **CRUD Operations:** Creating, reading, updating, and managing application data.
- **SQL Queries:** Using operations such as `INSERT`, `SELECT`, and `UPDATE`.
- **Joins:** Retrieving related information for student–tutor matching.
- **Data Integrity:** Maintaining consistent booking and payment records.
- **Transactions:** Supporting reliable operations involving bookings and payments.

## ⚙️ Operating System Concepts

TutorGo incorporates concepts related to concurrent and asynchronous application processing:

- **Concurrency:** Handling requests from multiple users.
- **Asynchronous Operations:** Managing database queries and email OTP verification.
- **Task Coordination:** Processing application requests and session status updates.
- **Shared Resource Access:** Managing concurrent access to database records.
- **Event-Driven Communication:** Using Socket.IO for real-time updates.

## 🚀 Getting Started

### Prerequisites

Install the following software before running the application:

- Node.js and npm
- MySQL Server
- Git
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/anushkagoyal154/TutorGO.git
cd TutorGO
```

### 2. Install Dependencies

Install the dependencies separately in the frontend and backend directories, according to the repository structure.

```bash
cd frontend
npm install
```

Then install the backend dependencies:

```bash
cd ../backend
npm install
```

If your repository uses different directory names, replace `frontend` and `backend` with the actual folder names.

### 3. Configure the Database

1. Start your MySQL server.
2. Create the database required by the application.
3. Configure the database connection using the project's existing configuration or environment variables.
4. Execute the SQL schema or initialization scripts included in the repository.

Example database creation:

```sql
CREATE DATABASE tutorgo;
```

The actual database name and schema should match the application's configuration.

### 4. Configure Environment Variables

Create the necessary `.env` file or files based on the backend configuration.

Typical configuration values may include:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=tutorgo
```

These are illustrative values, not a verified list of the project's required environment variables. Check the backend code for the exact configuration keys. Add any other credentials required by features such as email OTP verification.

**Security:** Never commit real passwords, API keys, email credentials, or other secrets to GitHub. Use a `.env.example` file with placeholder values when documenting configuration.

### 5. Run the Application

Start the backend using the script configured in its `package.json`. For example:

```bash
npm run dev
```

In a separate terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The frontend and backend commands may differ depending on the scripts defined in the repository. Check each `package.json` for the correct commands.

Once both services are running, open the local frontend URL displayed in your terminal.

## 🧪 Testing and Validation

The project presentation reports the following validation status:

- **Authentication:** Registration, login, password validation, duplicate email handling, and invalid credential rejection — Pass.
- **Integration:** Frontend, backend APIs, MySQL, resume parser, and Socket.IO events — Pass.
- **Error Handling and Validation:** In progress.
- **End-to-End System Testing:** Pending.

Further testing focuses on invalid inputs, nonexistent records, duplicate requests, database errors, and simultaneous user operations.

## 📈 Current Development Status

The core application is functional, with further development planned.

- Completed: Student and Tutor portals, backend structure, REST APIs, database integration, booking and payment workflows, and frontend-backend integration.
- In progress: Multi-user concurrency handling, error handling, and final validation.
- Planned: Free Learning Resources dashboard, enhanced resume parser, comprehensive system testing, and final documentation.

## 🔮 Future Enhancements

- Introduce a free learning resources dashboard for students and tutors.
- Improve resume parsing and automated tutor profile creation.
- Strengthen concurrent booking and shared-resource handling.
- Expand error handling and edge-case testing.
- Complete end-to-end validation and final integration.

## 👥 Team Mindforge

**Project:** TutorGo — An Intelligent On-Demand Tutor Matching and Scheduling Platform

**Institution:** Graphic Era (Deemed to be University), Dehradun

**Department:** Computer Science & Engineering

**Academic Session:** 2026–27

| Team Member | Role |
|---|---|
| Anushka | Team Lead |
| Jahnvi Bhandari | Team Member |
| Priyansha Kandwal | Team Member |
| Tanya Shahi | Team Member |

**Mentor:** Dr. Arun Chauhan

## 📚 References

- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/latest/api/)
- [Express.js Documentation](https://expressjs.com/)
- [MySQL Reference Manual](https://dev.mysql.com/doc/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

## 📄 License

No license has been specified yet. Add a `LICENSE` file if you intend to publish the project under an open-source license.

---

**TutorGo — Connecting students with the right tutors, at the right time.**