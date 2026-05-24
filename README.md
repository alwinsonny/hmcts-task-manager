# HMCTS Task Manager

A full-stack task management system for HMCTS caseworkers to create, view, update, and delete tasks.

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Backend   | Python 3.12 · Flask · SQLAlchemy · Marshmallow |
| Frontend  | React 18 · Axios · date-fns · react-hot-toast |
| Database  | MySQL 8                       |
| Tests     | pytest (backend) · React Testing Library (frontend) |
| Container | Docker · Docker Compose       |

---

## Project Structure

```
hmcts-task-manager/
├── backend/
│   ├── app.py               # Application factory
│   ├── config.py            # Config (prod + test)
│   ├── extensions.py        # SQLAlchemy instance
│   ├── models/
│   │   └── task.py          # Task ORM model
│   ├── schemas/
│   │   └── task_schema.py   # Marshmallow validation schemas
│   ├── routes/
│   │   ├── tasks.py         # Task CRUD endpoints
│   │   └── health.py        # Health check endpoint
│   ├── tests/
│   │   └── test_tasks.py    # Full API test suite (pytest)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── taskService.js   # Axios API layer
│   │   ├── hooks/
│   │   │   └── useTasks.js      # React data hook
│   │   ├── components/
│   │   │   ├── TaskCard.js
│   │   │   ├── TaskForm.js
│   │   │   ├── StatusBadge.js
│   │   │   └── Modal.js
│   │   ├── pages/
│   │   │   └── TasksPage.js     # Main page
│   │   ├── tests/
│   │   │   └── components.test.js
│   │   ├── styles.css
│   │   ├── App.js
│   │   └── index.js
│   ├── public/index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## Quick Start (Docker — recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Run everything

```bash
git clone https://github.com/alwinsonny/hmcts-task-manager.git
cd hmcts-task-manager
docker compose up --build
```

| Service  | URL                         |
|----------|-----------------------------|
| Frontend | http://localhost:3000       |
| Backend  | http://localhost:5000/api   |

---

## Manual Setup (without Docker)

### Prerequisites
- Python 3.12+
- Node 20+
- MySQL 8 running locally

### 1 — Database

```sql
CREATE DATABASE hmcts_tasks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2 — Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Edit DATABASE_URL if needed
python app.py
```

The API starts on **http://localhost:5000**. Tables are created automatically on first run.

### 3 — Frontend

```bash
cd frontend
npm install
npm start                       # Opens http://localhost:3000
```

---

## Running Tests

### Backend

```bash
cd backend
source venv/bin/activate
pytest -v
```

Uses an in-memory SQLite database — no MySQL required.

### Frontend

```bash
cd frontend
npm test
```

---

## API Reference

Base URL: `http://localhost:5000/api`

All responses follow the shape:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message", "details": { ... } }
```

### Task object

| Field        | Type             | Notes                                              |
|--------------|------------------|----------------------------------------------------|
| `id`         | integer          | Auto-assigned                                      |
| `title`      | string (≤255)    | Required                                           |
| `description`| string \| null   | Optional                                           |
| `status`     | string (enum)    | `pending` · `in_progress` · `completed` · `cancelled` |
| `due_date`   | ISO 8601 string  | Required · must be in the future on create         |
| `created_at` | ISO 8601 string  | Auto-set                                           |
| `updated_at` | ISO 8601 string  | Auto-updated                                       |

---

### Endpoints

#### `GET /api/tasks`
Retrieve all tasks. Optional query param `?status=pending|in_progress|completed|cancelled`.

**Response 200**
```json
{ "success": true, "data": [ { ...task }, ... ] }
```

---

#### `POST /api/tasks`
Create a new task.

**Request body**
```json
{
  "title": "Review case file",
  "description": "Check supporting documents",
  "status": "pending",
  "due_date": "2025-12-31T17:00:00Z"
}
```

**Response 201**
```json
{ "success": true, "data": { ...task } }
```

**Validation errors 422**
```json
{ "success": false, "error": "Validation failed.", "details": { "title": ["Title is required."] } }
```

---

#### `GET /api/tasks/{id}`
Retrieve a single task.

**Response 200** — task object.  
**Response 404** — task not found.

---

#### `PUT /api/tasks/{id}`
Full update of a task (any writable field).

**Request body** — same fields as POST, all optional.

**Response 200** — updated task.

---

#### `PATCH /api/tasks/{id}/status`
Update only the status of a task.

**Request body**
```json
{ "status": "completed" }
```

**Response 200** — updated task.

---

#### `DELETE /api/tasks/{id}`
Delete a task.

**Response 200**
```json
{ "success": true, "data": { "message": "Task 5 deleted successfully." } }
```

---

#### `GET /api/health`
Health check.

**Response 200**
```json
{ "status": "ok", "database": "ok" }
```

---

## Features

- **CRUD** — create, view, update (full or status-only), and delete tasks
- **Validation** — server-side (Marshmallow) + client-side (React); due date must be future on create
- **Status workflow** — Pending → In Progress → Completed / Cancelled; inline dropdown on each card
- **Overdue highlighting** — overdue tasks show a red left border and warning; due-today shows orange
- **Stats bar** — live counts of total, pending, in-progress, and completed tasks
- **Filter tabs** — filter by status without a page reload
- **Toast notifications** — success/error feedback on every action
- **Accessible** — ARIA labels, keyboard navigation, focus management, skip-to-content
- **Responsive** — single-column layout on mobile

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Default                                                   | Description         |
|----------------|-----------------------------------------------------------|---------------------|
| `DATABASE_URL` | `mysql+pymysql://root:password@localhost:3306/hmcts_tasks` | MySQL connection URL |
| `SECRET_KEY`   | `dev-secret-key-change-in-production`                      | Flask secret key    |

### Frontend

| Variable             | Default                 | Description    |
|----------------------|-------------------------|----------------|
| `REACT_APP_API_URL`  | `/api` (proxied)        | Backend base URL |

---

