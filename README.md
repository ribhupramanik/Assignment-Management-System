# Joineazy Assignment Management System

Joineazy is a full-stack assignment management application for students and professors.

The application allows students to create and manage groups, access assignments, confirm external submissions, and track group progress. Professors can create and edit assignments, assign them to all students or selected groups, track student/group submission confirmations, and view dashboard analytics.

---

## Features

### Student

- Student registration and login
- JWT-based authentication
- Create student groups
- View groups the student belongs to
- Add group members using:
  - Student ID
  - Student email
- View group members
- View assignments assigned:
  - To all students
  - To groups the student belongs to
- Access the professor-provided OneDrive submission link
- Two-step submission confirmation:
  1. `Yes, I have submitted`
  2. Final confirmation
- View personal submission status
- Track group assignment progress
- View:
  - Not Started
  - In Progress
  - Completed
- Responsive student dashboard

### Professor / Admin

- Secure professor login
- Role-based route protection
- Create assignments with:
  - Title
  - Description
  - Due date
  - OneDrive submission link
- Assign work to:
  - All students
  - One or more specific groups
- View existing assignments
- Edit assignments
- Change assignment scope
- Change assigned groups
- Prevent confusing duplicate assignment titles for the same audience
- Track assignment submissions
- Student-wise submission status:
  - Confirmed
  - Pending
  - Confirmed Late
- Group-wise completion tracking
- Dashboard analytics:
  - Total students
  - Total groups
  - Total assignments
  - Overdue assignments
  - Expected confirmations
  - Confirmed submissions
  - Pending submissions
  - Overall confirmation percentage
  - Assignment performance
  - Group performance
- Responsive professor dashboard

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend

- Node.js
- Express.js
- PostgreSQL
- `pg`
- JSON Web Tokens
- bcryptjs
- CORS
- dotenv

### Containers and Serving

- Docker and Docker Compose
- PostgreSQL 16 Alpine container
- Node.js 22 Alpine images for backend runtime and frontend build
- Nginx for serving the frontend production build
- Persistent Docker volume for PostgreSQL data

### Database

- PostgreSQL
- Foreign-key constraints
- Unique constraints
- Transactions
- Cascading relationships
- SQL migrations

---

## Architecture Overview

Joineazy separates the React interface, Express REST API, and PostgreSQL database.

```text
Browser
  ├── GET http://localhost:5173
  │       └── Frontend container: Nginx :80 → React/Vite static build
  │
  └── REST requests + JWT → http://localhost:5000/api
          └── Backend container: Node.js / Express :5000
                  └── Parameterized SQL via pg → db:5432
                          └── PostgreSQL container → persistent volume

Student → professor-provided OneDrive link → external file submission
Student → Joineazy API → submission confirmation and timestamp
```

React runs in the browser, so its API URL must be reachable from the browser. In this local Docker setup it calls `http://localhost:5000/api` directly; Nginx serves the frontend and does not proxy API requests. Express connects to PostgreSQL through the Compose service name `db` on the internal Docker network.

The backend validates JWTs, enforces roles and assignment access, and handles group, assignment, confirmation, and analytics operations. PostgreSQL stores users, groups, memberships, assignments, assignment targeting, and submission confirmations. Joineazy records student confirmations; it does not independently verify files uploaded to OneDrive.

See [docs/database.md](docs/database.md) for the ER diagram and database documentation.

---

## Key Design Decisions

- **JWT authentication and backend authorization:** authenticated requests use JWTs. Backend middleware enforces the `student` and `admin` roles; frontend route protection supports navigation but is not the security boundary.
- **Seeded professor account:** public registration creates students only. A repeatable server-side seed creates or updates the professor account, with passwords hashed before storage.
- **Relational data model:** `group_members` and `assignment_groups` represent many-to-many relationships. Foreign keys and unique constraints protect consistency, while transactions keep multi-step changes together.
- **Explicit assignment scope:** assignments target either all students or selected groups. Access checks use the student's membership rather than relying on which links the interface displays.
- **External file submission:** professors provide OneDrive links; Joineazy stores confirmations and timestamps. This keeps file hosting outside the application. Confirmation and late status describe the recorded confirmation, not independent proof of an upload.
- **Two-step confirmation:** the interface asks for a final confirmation, and the backend requires `confirmed: true` before recording it.
- **Calculated progress:** completion percentages and statuses come from current membership and confirmation data, avoiding a separately stored percentage that could become stale.
- **Duplicate prevention:** group names are unique per creator, and assignment validation prevents confusing duplicate titles for the same audience.

---

## Project Structure

```text
MERN-JoinEazy_Task/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── adminAnalyticsController.js
│   │   │   ├── adminGroupController.js
│   │   │   ├── adminSubmissionController.js
│   │   │   ├── assignmentController.js
│   │   │   ├── authController.js
│   │   │   ├── groupController.js
│   │   │   ├── progressController.js
│   │   │   ├── studentAssignmentController.js
│   │   │   └── submissionController.js
│   │   │
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   ├── 001_initial_schema.sql
│   │   │   │   └── 002_unique_group_name_per_creator.sql
│   │   │   │
│   │   │   └── seeds/
│   │   │       └── seedAdmin.js
│   │   │
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   │
│   │   ├── routes/
│   │   │   ├── adminAssignmentRoutes.js
│   │   │   ├── adminDashboardRoutes.js
│   │   │   ├── adminGroupRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── groupRoutes.js
│   │   │   └── studentAssignmentRoutes.js
│   │   │
│   │   ├── utils/
│   │   │   └── generateToken.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── database.md
│
├── docker-compose.yml
├── .env.docker.example
├── .gitignore
└── README.md
```

---

## Prerequisites

Choose either Docker Setup or Local Setup. Both run the same application.

### Docker Setup

- Git
- Docker Desktop with Docker Compose v2 on Windows/macOS, or Docker Engine with the Compose plugin on Linux
- A running Docker engine configured for Linux containers
- Available host ports `5173` and `5000`

Node.js, npm, and PostgreSQL run inside containers and do not need separate host installations for this option.

```bash
git --version
docker --version
docker compose version
```

### Local Setup

- Git
- Node.js and npm (the Docker build uses Node.js 22)
- PostgreSQL and the `psql` command-line client (the Docker stack uses PostgreSQL 16)

```bash
node --version
npm --version
psql --version
git --version
```

---

# Docker Setup

Run the commands below from the repository root, where `docker-compose.yml` is located. PowerShell examples are provided for Windows.

## 1. Clone and Configure

If you have not already cloned the repository:

```bash
git clone https://github.com/ribhupramanik/Assignment-Management-System.git MERN-JoinEazy_Task
cd MERN-JoinEazy_Task
```

Copy the committed template to a private environment file:

```powershell
Copy-Item .env.docker.example .env.docker
```

On macOS/Linux, use `cp .env.docker.example .env.docker` instead.

Edit `.env.docker` and replace every password/secret placeholder with your own value:

```env
DB_PASSWORD=replace_with_a_unique_database_password
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_NAME=Joineazy Professor
ADMIN_EMAIL=professor@joineazy.test
ADMIN_PASSWORD=replace_with_a_unique_admin_password
```

These are placeholders, not working credentials. Keep `.env.docker` private and ignored by Git; commit only `.env.docker.example`. Do not put database passwords, JWT secrets, or admin passwords in `VITE_*` variables, which become part of the public browser bundle.

Compose supplies the backend environment, including `DB_HOST=db`, `DB_PORT=5432`, and `CLIENT_URL=http://localhost:5173`. Separate host-side `backend/.env` and `frontend/.env` files are not required for this Docker setup. Local Setup below documents those files for running without Docker.

## 2. Build and Start All Services

Stop any local development servers using ports `5000` or `5173`, then run:

```powershell
docker compose --env-file .env.docker up --build -d
```

Omit `-d` to run attached and watch startup logs. You can rerun `up --build -d` while the existing Compose stack is running; a preliminary `down` is not required. Compose rebuilds images and recreates affected containers while retaining the database volume.

The stack starts three containers:

| Compose service | Container | Purpose | Host access |
|---|---|---|---|
| `db` | `joineazy-db` | PostgreSQL 16 | Internal network only, `db:5432` |
| `backend` | `joineazy-backend` | Express API | `http://localhost:5000` → container port `5000` |
| `frontend` | `joineazy-frontend` | Nginx serving React | `http://localhost:5173` → container port `80` |

The recorded Docker verification showed PostgreSQL healthy and both application containers running. The Docker database also contained all six application tables and the seeded professor account. Use the checks below to verify your own run and application workflows.

### Database Initialization and Startup Order

On an empty PostgreSQL data volume, SQL files mounted from `backend/src/db/migrations` into `/docker-entrypoint-initdb.d` initialize the schema in filename order:

1. `001_initial_schema.sql`
2. `002_unique_group_name_per_creator.sql`

The backend waits for the database health check, runs `npm run seed:admin`, and then runs `npm start`. The seed is repeatable and updates the configured professor account. The frontend starts after the backend container is started; this ordering alone is not an API readiness check.

The Compose volume `joineazy_postgres_data` retains database data across container replacement and normal shutdown. Compose may prefix the actual volume name with the project name. This database is separate from a host-installed PostgreSQL database, so existing local students, groups, and assignments are not imported automatically.

Initialization scripts run only when PostgreSQL initializes an empty data directory. Restarting containers or rebuilding images does not apply newly added migration files to an existing database. Apply later migrations deliberately to an existing database, or use the destructive reset below only when its data can be discarded. Changing `DB_PASSWORD` in the environment file also does not change the password of a database role in an already initialized volume.

## 3. Verify the Stack

```powershell
docker compose --env-file .env.docker ps
```

Expected status:

```text
joineazy-db         Up (healthy)
joineazy-backend    Up
joineazy-frontend   Up
```

Open the [frontend](http://localhost:5173) and [API health endpoint](http://localhost:5000/api/health).

Log in as professor using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your private `.env.docker`. Register student accounts through `/register`; there are no hard-coded student credentials.

Verify these workflows:

- Professor: log in, create and edit an assignment, select its audience, view submissions, and inspect analytics.
- Student: register, log in, create a group, add a registered member, view an eligible assignment, open the OneDrive link, confirm submission, and view progress.
- React Router: refresh `/student/groups` while logged in as a student and `/admin/assignments` while logged in as professor. Nginx should return the React application rather than an Nginx `404`.

The frontend's `nginx.conf` uses `try_files $uri $uri/ /index.html;` to support direct visits and refreshes on client-side routes.

Optionally inspect the database tables without installing PostgreSQL on the host:

```powershell
docker compose --env-file .env.docker exec db psql -U joineazy_user -d joineazy_db -c '\dt'
```

Expected tables: `users`, `groups`, `group_members`, `assignments`, `assignment_groups`, and `submissions`.

## 4. View Logs and Rebuild

```powershell
docker compose --env-file .env.docker logs -f
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker logs -f db
docker compose --env-file .env.docker logs -f frontend
```

Run the desired log command; press `Ctrl+C` to leave log viewing. After source changes, rebuild with:

```powershell
docker compose --env-file .env.docker up --build -d
```

The containers use built application images rather than development hot reload. `VITE_API_URL` is a frontend build argument in Compose, so changing the browser API address requires rebuilding the frontend.

## 5. Stop and Start Without Deleting Data

```powershell
docker compose --env-file .env.docker down
```

This removes the stack's containers and network while preserving its named PostgreSQL volume. Start again with:

```powershell
docker compose --env-file .env.docker up -d
```

## 6. Reset the Docker Database — Destructive

**The following commands permanently delete the Docker PostgreSQL volume, including its students, groups, assignments, and submission confirmations. Back up any data you need first. This is not a routine shutdown command.**

```powershell
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up --build -d
```

PostgreSQL initializes a fresh database, reruns the initialization SQL, and the backend seeds the professor account from `.env.docker`. This reset targets the Compose database volume, not a separate host PostgreSQL installation.

## Troubleshooting

- **Port already allocated:** stop the local backend/Vite servers or other processes using `5000` or `5173`. If you change host ports, also align `CLIENT_URL` and the frontend API build argument with the browser-facing URLs.
- **Backend cannot connect to PostgreSQL:** inspect `db` and `backend` logs; use `DB_HOST=db` inside Compose. PostgreSQL has no published host port in this setup.
- **Schema changes are missing:** initialization SQL does not rerun on an existing volume. Apply the required migration or intentionally reset disposable data.
- **Browser cannot reach the API:** confirm the API health endpoint is reachable and that the frontend was built with `http://localhost:5000/api` for this local setup. The browser cannot resolve the Compose hostname `backend`.
- **Professor login fails:** check the private admin environment values and backend seed logs. The Docker account comes from `.env.docker`, independently of a locally seeded account.

---

## Deployment Decisions

The current deployment is a local Docker Compose stack for reproducible setup, evaluation, and demonstrations. A public hosted deployment is not documented as completed.

- **Separate services:** frontend, API, and database have distinct containers and responsibilities.
- **Frontend production build:** a multi-stage Dockerfile builds React/Vite with Node.js and copies `dist/` into Nginx. The final frontend container serves static files without a Vite development server.
- **Internal database networking:** only the frontend and API publish host ports. Keeping PostgreSQL internal also avoids conflicts with a host PostgreSQL installation on port `5432`.
- **Persistent data:** a named volume survives ordinary shutdown and image rebuilds; deleting it is an explicit reset operation.
- **Repeatable initial setup:** PostgreSQL initialization scripts and the admin seed prepare a fresh environment. The initialization mount is not an ongoing migration runner for existing databases.
- **Environment-specific configuration:** private credentials stay in ignored environment files. The browser API URL is set at build time, while backend configuration is supplied when its container starts.

For a future public deployment, use browser-reachable HTTPS frontend/API addresses, update the backend `CLIENT_URL`, and rebuild the frontend with the deployed `VITE_API_URL`. `localhost` refers to each visitor's own machine and is unsuitable as a public API address. Configure TLS, private database access, provider-required database SSL, managed secrets, backups, and a controlled migration process before using persistent production data. Protect the initial professor credentials and account for the seed updating that account on backend startup.

---

# Local Setup

Use this option to run PostgreSQL, the backend, and the Vite development server directly on your machine. Stop the Docker stack first if it is using ports 5000 and 5173.

## 1. Clone the Repository

```bash
git clone https://github.com/ribhupramanik/Assignment-Management-System.git MERN-JoinEazy_Task
cd MERN-JoinEazy_Task
```

---

# PostgreSQL Setup

## 2. Connect as the PostgreSQL Administrator

```bash
psql -U postgres
```

Enter the PostgreSQL password configured during installation.

---

## 3. Create the Application User

Inside PostgreSQL:

```sql
CREATE USER joineazy_user
WITH PASSWORD 'your_database_password';
```

---

## 4. Create the Database

```sql
CREATE DATABASE joineazy_db
OWNER joineazy_user;
```

Exit PostgreSQL:

```sql
\q
```

---

# Backend Setup

## 5. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 6. Configure Backend Environment Variables

Create:

```text
backend/.env
```

Use:

```env
PORT=5000

CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_USER=joineazy_user
DB_PASSWORD=your_database_password
DB_NAME=joineazy_db

JWT_SECRET=replace_with_a_secure_random_secret
JWT_EXPIRES_IN=2h

ADMIN_NAME=Joineazy Professor
ADMIN_EMAIL=professor@joineazy.test
ADMIN_PASSWORD=replace_with_a_secure_admin_password
```

Do not commit `.env`.

A safe template is available in:

```text
backend/.env.example
```

---

# Database Migrations

Return to the project root before running these commands.

## 7. Run the Initial Schema Migration

```bash
psql -U joineazy_user -d joineazy_db -h localhost -f backend/src/db/migrations/001_initial_schema.sql
```

---

## 8. Run the Group Uniqueness Migration

```bash
psql -U joineazy_user -d joineazy_db -h localhost -f backend/src/db/migrations/002_unique_group_name_per_creator.sql
```

The second migration prevents the same student from creating duplicate group names while still allowing different students to use the same group name.

For example:

```text
Student A → Team Alpha
Student B → Team Alpha
```

is allowed.

But:

```text
Student A → Team Alpha
Student A → Team Alpha
```

is rejected.

---

# Seed Professor Account

## 9. Create the Professor Account

From:

```text
backend/
```

run:

```bash
npm run seed:admin
```

The admin account is created using the values in:

```env
ADMIN_NAME
ADMIN_EMAIL
ADMIN_PASSWORD
```

The password is hashed before storage.

The seed is safe to rerun and updates the existing admin account instead of creating duplicates.

---

# Start the Backend

## 10. Development Mode

From:

```text
backend/
```

run:

```bash
npm run dev
```

The API should start at:

```text
http://localhost:5000
```

Health endpoint:

```text
GET http://localhost:5000/api/health
```

---

# Frontend Setup

## 11. Install Frontend Dependencies

Open another terminal at the repository root:

```bash
cd frontend
npm install
```

---

## 12. Configure Frontend Environment

Create:

```text
frontend/.env
```

with:

```env
VITE_API_URL=http://localhost:5000/api
```

A template is available at:

```text
frontend/.env.example
```

---

## 13. Start the Frontend

```bash
npm run dev
```

The frontend should be available at:

```text
http://localhost:5173
```

---

# Authentication

## Student Registration

Students register through:

```text
/register
```

Required information:

- Full name
- Student ID
- Email
- Password

Students always receive:

```text
role = student
```

Public professor registration is intentionally not available.

---

## Professor Login

The professor account is created through the admin seed.

Use the values configured in:

```env
ADMIN_EMAIL
ADMIN_PASSWORD
```

to log in through the normal login page.

---

# API Overview

## Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

---

## Student Groups

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/groups` | Create group |
| GET | `/api/groups/mine` | View student's groups |
| GET | `/api/groups/:groupId/members` | View members |
| POST | `/api/groups/:groupId/members` | Add member |
| GET | `/api/groups/:groupId/progress` | View group progress |

Group creation and management routes require the Student role.

Only the group creator can add members.

---

## Student Assignments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assignments` | List accessible assignments |
| GET | `/api/assignments/:assignmentId` | View assignment |
| GET | `/api/assignments/:assignmentId/submission` | View submission status |
| POST | `/api/assignments/:assignmentId/submission/confirm` | Confirm submission |

Students only receive assignments that are:

- Assigned to all students, or
- Assigned to a group they belong to

---

## Professor Groups

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/groups` | List available student groups |

---

## Professor Assignments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/assignments` | Create assignment |
| GET | `/api/admin/assignments` | List assignments |
| GET | `/api/admin/assignments/:assignmentId` | View assignment |
| PATCH | `/api/admin/assignments/:assignmentId` | Edit assignment |
| GET | `/api/admin/assignments/:assignmentId/submissions` | Track submissions |

These routes require the Admin role.

---

## Professor Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard/analytics` | Dashboard analytics |

---

# Assignment Targeting

Assignments support two scopes.

## All Students

```json
{
  "scope": "all"
}
```

Every registered student can access the assignment.

---

## Specific Groups

```json
{
  "scope": "groups",
  "groupIds": [1, 2]
}
```

Only students belonging to one of the selected groups can access the assignment.

---

# Submission Workflow

Joineazy does not upload student files directly.

The professor supplies a OneDrive submission link.

The student workflow is:

```text
Open Assignment
      ↓
Open OneDrive Link
      ↓
Upload Work
      ↓
Return to Joineazy
      ↓
Yes, I have submitted
      ↓
Confirm submission
```

Joineazy then records the confirmation timestamp.

This allows the professor to track:

- Confirmed submissions
- Pending submissions
- Late confirmations

---

# Progress Tracking

For group assignments, Joineazy calculates progress dynamically.

Example:

```text
Team Alpha

Members:
3

Confirmed:
2

Completion:
2 / 3 × 100 = 66.67%
```

Statuses are:

```text
0 confirmations   → Not Started
Partial completion → In Progress
100% completion    → Completed
```

Progress is calculated from live membership and submission data rather than storing a separate percentage in the database.

---

# Role-Based Access Control

Joineazy uses both frontend and backend role protection.

### Frontend

React routes prevent students from opening professor pages and vice versa.

### Backend

Backend middleware provides actual security:

```text
Authentication
      ↓
JWT Validation
      ↓
Role Authorization
      ↓
Controller
```

Available roles:

```text
student
admin
```

The backend remains the source of truth for authorization.

---

# Database Relationships

The main entities are:

```text
users
groups
group_members
assignments
assignment_groups
submissions
```

Important relationships:

```text
User
 ├── creates Groups
 ├── belongs to Groups
 └── confirms Submissions

Group
 ├── contains Students
 └── receives Assignments

Assignment
 ├── created by Professor
 ├── applies to all students OR selected groups
 └── has Submission confirmations
```

A detailed ER diagram and database documentation are available in
[docs/database.md](docs/database.md).

---

# Security Considerations

The application includes:

- Password hashing using bcrypt
- JWT authentication
- Protected backend routes
- Role-based authorization
- Parameterized PostgreSQL queries
- Database foreign keys
- Unique constraints
- Transaction-based multi-step database operations
- Hidden unauthorized resources using `404` responses where appropriate
- Environment variables for secrets
- Admin account creation through a server-side seed rather than public registration

Keep `backend/.env`, `frontend/.env`, and `.env.docker` out of Git and shared ZIP archives. Commit only sanitized `.env.example` and `.env.docker.example` templates. All passwords and secrets shown in this README are placeholders; supply private values in your own environment. Frontend configuration is public and must never contain secrets.

---

# Responsive Design

The Student and Professor portals are designed for:

- Mobile
- Tablet
- Desktop

Mobile layouts use cards and stacked interfaces where wide desktop tables would otherwise be difficult to use.

---

# Production Build

To verify the frontend production build:

```bash
cd frontend
npm run build
```

The generated build output is placed in:

```text
frontend/dist/
```

The `dist` directory should not be committed.

---

# Development Notes

The application was developed incrementally with Git commits covering:

- Project initialization
- PostgreSQL integration
- Database schema
- Student authentication
- JWT middleware
- Admin seed
- Group management
- Assignment management
- Student assignment access
- Submission confirmation
- Progress tracking
- Professor submission tracking
- Analytics
- Student frontend
- Professor frontend
- Responsive design and reliability improvements

Docker support adds separate backend/frontend images, an Nginx configuration, and a Compose stack with persistent PostgreSQL storage.

This provides a clear project history rather than delivering the application as a single generated commit.

---

# Future Improvements

Potential extensions include:

- Course and semester support
- Assignment attachments
- Email notifications
- Password reset
- Pagination and search
- Archived assignments
- Multiple professor/course ownership
- Automated tests
- Cloud deployment
- Microsoft OneDrive API integration
- Real-time notifications

---

## License

This project was developed as a technical assignment / educational project.
