# 🏥 ProceTurn AI - Hospital Management System (API & Core)

**ProceTurn AI** is the result of a final capstone project developed under agile methodologies, designed to simulate a real work environment. The system provides a complete solution for clinic and hospital management, focusing on efficient data processing, AI-driven workflow automation, and Backend scalability.

---

## 🏗️ Description and Architecture

The core of the project is structured on a client-server architecture, where the main focus lies on a robust RESTful API and an optimized relational database schema, accompanied by an administrative dashboard in React.

### Backend & Data Architecture (Core)

- **Main Framework:** Python with Flask.
- **Database:** PostgreSQL for relational data persistence.
- **ORM & Migrations:** SQLAlchemy and Flask-Migrate (Alembic) for data modeling and schema version control.
- **Security & Authentication:** Flask-JWT-Extended for route protection and session management.
- **Third-Party Integrations:** Endpoint integration for external messaging services (WhatsApp via Twilio) and an AI engine for intelligent medical appointment suggestions and pre-filling based on chat history.
- **Data Structure (SQL):** The schema is highly normalized to guarantee referential integrity. It includes entities such as:
  - `User`, `Patient` (Profile and security management).
  - `Appointment`, `Procedure`, `Specialty`, `ProcedureAvailability` (Appointment logic, agendas, and schedule blocking).
  - `Message`, `Notification`, `AISuggestion` (Communication history, asynchronous notifications, and AI integrations).

### Frontend Architecture (Secondary Mention)

- **Technology:** React + Vite.
- **Objective:** Efficiently consume the RESTful API to provide an interactive management dashboard (calendar, real-time chat, patient and appointment administration).

---

## 👨‍💻 My Contributions and Role in the Team

My participation in the team was strongly oriented towards Backend Development, taking responsibility for the information logic, API design, and process automation.

**Key Responsibilities and Achievements:**

- **Backend Business Logic:** I developed critical endpoints for conversational flow and medical appointment generation. I implemented the backend for **AI Suggestions**, designing the logic that analyzes interactions and suggests appointments intelligently.
- **Endpoint Security:** I ensured that access to critical routes and payload handling for the user and notification systems complied with the corresponding validations and access standards.
- **Adaptability and Frontend Resolution:** Faced with bottlenecks and blocks in product delivery, I demonstrated adaptability by taking on the role of Frontend developer in **React**. I built key components like the interactive Chat view (integrating specialized libraries) and programmed the URL parameter logic (`NewAppointment.jsx`) so the interface could communicate seamlessly with the backend's AI engine, guaranteeing the timely delivery of the feature.

---

## 🚀 Local Deployment

Below are the exact steps to set up the development environment locally, based on the project's dependency files.

### Prerequisites

- Python 3.8+
- Node.js 20.0.0+
- PostgreSQL

### 1. Backend Setup (Python/Flask)

Navigate to the root directory of the project. The environment uses `pipenv` for package management:

```bash
# 1. Install project dependencies

pipenv install

# 2. Configure environment variables
# 💡 Database configuration note:
# - By default (without additional configuration), the system will use a local SQLite database.
# - If you want to run it with PostgreSQL, simply define the variable in your .env:
#   DATABASE_URL="postgresql://user:password@localhost:5432/db_name"

cp .env.example .env

# 3. Migrate the database

pipenv run upgrade

# 4. Start the Flask server
# The API will be listening on http://localhost:3001

pipenv run start
```

### 2. Frontend Setup (React/Vite)

Open a new terminal in the root directory of the project:

```bash
# 1. Install Node.js dependencies

npm install

# 2. Start the Vite development server
# The local React development environment will be available on the indicated port (e.g., http://localhost:5173)

npm run dev
```

### 3. Twilio Webhook Setup (WhatsApp Integration)

To test the WhatsApp chat locally, you need to expose the API's port `3001` to the internet using ngrok. Open a new terminal and run:

```bash
# Expose local port 3001

ngrok http 3001
```

After running the command, ngrok will generate a public HTTPS URL. You must configure this URL in your Twilio Sandbox:

1. Go to your Twilio Console and navigate to the WhatsApp Sandbox settings.
2. Locate the **'When a message comes in'** field.
3. Paste the generated ngrok HTTPS URL, pointing to the corresponding webhook endpoint (e.g., `https://<your-ngrok-id>.ngrok.app/api/webhook`).
4. Save the settings.

---

## 👥 Team / Contributors

- Laureano Gonzalez - Fullstack Developer | [[LinkedIn]](https://www.linkedin.com/in/laureano-gonzalez-dev/) | [[GitHub]](https://github.com/laureanogonzalez02)
- [@Drokko-Dev](https://github.com/Drokko-Dev) - Jaime Vega
- [@VicenteCastroIb](https://github.com/VicenteCastroIb) - Vicente Castro
- [@Fragoz22](https://github.com/Fragoz22) - Francisco M. Gómez
