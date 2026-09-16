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

### Database

- PostgreSQL
- Foreign-key constraints
- Unique constraints
- Transactions
- Cascading relationships
- SQL migrations

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
│   │   ├── app.js
│   │   └── server.js
│   │
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
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- PostgreSQL
- Git

Verify installation:

```bash
node --version
npm --version
psql --version
git --version
```

---

# Local Setup

## 1. Clone the Repository

```bash
git clone <repository-url>
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

Open another terminal:

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

A dedicated ER diagram can be found in the project documentation once generated.

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
