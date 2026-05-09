# TaskFlow — Team Task Manager

A full-stack project management application with role-based access control, real-time task tracking, and interactive dashboard analytics.

![Django](https://img.shields.io/badge/Django-4.2-092E20?logo=django)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![DRF](https://img.shields.io/badge/DRF-3.14-FF6C37?logo=django)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)

---

## Features

### Authentication
- JWT-based authentication (access + refresh tokens)
- Automatic token refresh on expiry
- Registration with password confirmation
- Protected routes with auth guards

### Projects
- Create, edit, and delete projects
- Member management (auto-adds creator)
- Task and member count on project cards

### Tasks
- Full CRUD with modal forms
- Status cycling (To Do → In Progress → Done)
- Priority levels (Low, Medium, High)
- Assign tasks to project members
- Due date tracking with overdue highlighting
- Filter by project, status, priority, assignee
- Text search across task titles and descriptions

### Dashboard
- Stat cards (Projects, Total Tasks, Completed)
- Tasks by Status donut chart
- Completed vs Pending bar chart with completion rate
- Priority distribution with progress bars
- Recent tasks table with overdue indicators

### UI/UX
- Responsive design (mobile, tablet, desktop)
- Toast notifications (success/error)
- Confirmation modals before deletion
- Loading spinners and empty states
- Smooth animations and transitions

### Role-Based Access
- **Admin** — sees all projects and tasks, can manage any resource
- **Member** — sees only projects they belong to, can create tasks and edit their own

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework |
| Auth | SimpleJWT (access + refresh tokens) |
| Database | SQLite (dev) / PostgreSQL (production) |
| Filtering | django-filter |
| Frontend | React 19, React Router 7 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| HTTP | Axios with interceptors |
| Production | Gunicorn, Railway |

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a superuser (optional, for admin panel)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Backend runs at `http://localhost:8000`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at `http://localhost:5173` (proxies `/api` to backend)

---

## Railway Deployment

### 1. Push to GitHub

Ensure your repo contains:
- `backend/` — Django project
- `frontend/` — React app
- `.gitignore` — excludes `venv/`, `node_modules/`, `db.sqlite3`, `.env`

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** database service
3. Add a **Python** service from the `backend/` directory
4. Add a **Node.js** service from the `frontend/` directory

### 3. Backend Service Configuration

Railway auto-detects settings from:

| File | Purpose |
|------|---------|
| `backend/Procfile` | Start command: `gunicorn config.wsgi:application` |
| `backend/runtime.txt` | Python version: `python-3.11.9` |
| `backend/requirements.txt` | Python dependencies |

Set these environment variables on the backend service:

| Variable | Required | Example |
|----------|----------|---------|
| `SECRET_KEY` | Yes | Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | Yes | `False` |
| `ALLOWED_HOSTS` | Yes | `yourapp.railway.app` |
| `DATABASE_URL` | Auto | Set automatically by Railway's PostgreSQL plugin |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://your-frontend.railway.app` |
| `PYTHONPATH` | Yes | `backend` |
| `DJANGO_SETTINGS_MODULE` | Yes | `config.settings` |

Railway's `Procfile` release command automatically runs `migrate` and `collectstatic`.

### 4. Frontend Service Configuration

Set the root directory to `frontend/`.

Set these environment variables:

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | No | Leave empty — Vite proxy handles `/api` in dev; in production, configure a reverse proxy or serve frontend from Django's `STATIC_ROOT` |

**Build Command:**
```
npm run build
```

**Start Command:**
```
npx serve dist -s -l $PORT
```

Add `serve` as a dev dependency: `npm install -D serve`

### 5. Connect Frontend to Backend

Update `CORS_ALLOWED_ORIGINS` on the backend to include the frontend URL.

---

## Screenshots

> *Screenshots can be added here after deployment.*

| Page | Description |
|------|-------------|
| Login | JWT-based sign-in form |
| Register | Account creation with password confirmation |
| Dashboard | Stat cards, charts, recent tasks |
| Projects | Card grid with create/edit/delete modals |
| Tasks | Filterable table with status cycling and overdue highlighting |

---

## API Overview

All endpoints require `Authorization: Bearer <access_token>` unless noted.

### Auth

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Obtain JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/profile/` | Get current user profile |

### Projects

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/projects/` | List projects |
| POST | `/api/projects/` | Create a project |
| GET | `/api/projects/<id>/` | Project detail |
| PATCH | `/api/projects/<id>/` | Update project |
| DELETE | `/api/projects/<id>/` | Delete project |

### Tasks

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/tasks/` | List tasks (with filters) |
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/<id>/` | Task detail |
| PATCH | `/api/tasks/<id>/` | Update task |
| DELETE | `/api/tasks/<id>/` | Delete task |

**Task filters:** `?project=`, `?status=`, `?priority=`, `?assignee=`, `?assignee_isnull=true`, `?created_by=`, `?due_date_before=`, `?due_date_after=`, `?search=`, `?ordering=`

### Users

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/users/` | List all users (admin only) |

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── apps/
│   │   ├── core/          # Permissions
│   │   ├── projects/      # Project model, views, serializers
│   │   ├── tasks/         # Task model, views, serializers, filters
│   │   └── users/         # User model, auth views, serializers
│   ├── config/
│   │   ├── settings.py    # Django settings (env-aware)
│   │   ├── urls.py        # URL routing + DRF router
│   │   └── wsgi.py        # WSGI entry point (Gunicorn)
│   ├── Procfile           # Railway start + release commands
│   ├── runtime.txt        # Python version
│   ├── requirements.txt   # Python dependencies
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios instance + interceptors
│   │   ├── components/    # Modal, ConfirmModal, Navbar, ProtectedRoute
│   │   ├── context/       # AuthContext, ToastContext
│   │   └── pages/         # Dashboard, Projects, Tasks, Login, Register
│   ├── index.html
│   ├── vite.config.js     # Dev proxy to backend
│   └── package.json
└── README.md
```

---

## License

This project is for educational/demonstration purposes.
