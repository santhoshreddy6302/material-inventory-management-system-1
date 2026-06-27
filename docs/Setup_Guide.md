# Setup Guide — Material Inventory Management System

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v18+ |
| npm | v9+ |
| MySQL | v8+ |
| Git | Latest |

---

## Step 1 — Extract the Project

Extract the ZIP file. You should have this structure:
```
material-inventory/
├── backend/
├── frontend/
├── database/
├── docs/
└── package.json   ← root convenience scripts
```

---

## Step 2 — Database Setup

Open **MySQL Workbench** or **MySQL CLI** and run:

```bash
mysql -u root -p < database/material_inventory.sql
```

This creates the `material_inventory` database with all 23 tables and seed data including 5 demo users, 4 projects, 5 sites, 5 suppliers, 12 materials.

---

## Step 3 — Configure Backend Environment

```bash
# Navigate to backend folder
cd backend

# Copy example env file
cp .env.example .env     # macOS/Linux
copy .env.example .env   # Windows
```

Edit `backend/.env` and set your values:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_ACTUAL_MYSQL_PASSWORD
DB_NAME=material_inventory

JWT_SECRET=any_long_random_string_at_least_32_characters
JWT_EXPIRES_IN=7d
```

---

## Step 4 — Install All Dependencies

### Option A — From root folder (run both at once)

```bash
# From the root material-inventory/ folder:
npm install                    # installs concurrently
npm run install:all            # installs backend + frontend deps
```

### Option B — Install individually

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

---

## Step 5 — Seed the Database

```bash
# From the root material-inventory/ folder:
npm run seed

# OR from backend/ folder:
cd backend && npm run seed
```

---

## Step 6 — Start the Application

### ✅ Option A — Start BOTH from root folder (recommended)

```bash
# From root material-inventory/ folder:
npm install          # first time only (installs concurrently)
npm run dev          # starts backend on :5000 AND frontend on :5173
```

### Option B — Start separately (two terminal windows)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open your browser: **http://localhost:5173**

---

## Step 7 — First Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@constco.com | Admin@123 |
| Project Manager | pm@constco.com | Admin@123 |
| Site Engineer | engineer@constco.com | Admin@123 |
| Procurement | procurement@constco.com | Admin@123 |
| Accounts | accounts@constco.com | Admin@123 |

> ⚠️ Change all default passwords in production!

---

## ❌ Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `Missing script: "dev"` | Running `npm run dev` without first running `npm install` in root | Run `npm install` then `npm run dev` from root folder |
| `ECONNREFUSED 3306` | MySQL not running | Start MySQL: `net start mysql` (Windows) or `sudo systemctl start mysql` (Linux) |
| `Access denied for user 'root'` | Wrong DB password in `.env` | Set `DB_PASSWORD` correctly in `backend/.env` |
| `Cannot find module` | Dependencies not installed | Run `npm run install:all` from root |
| CORS error | Frontend URL mismatch | Set `FRONTEND_URL=http://localhost:5173` in `backend/.env` |
| Blank white page | API unreachable | Make sure backend is running on port 5000 |
| Port 5000 in use | Another service on 5000 | Change `PORT=5001` in `backend/.env` and update `VITE_API_URL` in `frontend/.env` |

---

## Quick Reference — All Commands

```bash
# ── From root material-inventory/ ──────────────────────
npm install            # Install concurrently (run once)
npm run install:all    # Install ALL dependencies (backend + frontend)
npm run dev            # Start BOTH backend + frontend
npm run dev:backend    # Start backend only
npm run dev:frontend   # Start frontend only
npm run seed           # Seed database
npm run build:frontend # Build frontend for production

# ── From backend/ ──────────────────────────────────────
npm install            # Install backend dependencies
npm run dev            # Start with nodemon (auto-restart)
npm start              # Start production
npm run seed           # Seed database

# ── From frontend/ ─────────────────────────────────────
npm install            # Install frontend dependencies
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
```

---

## Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Set Build Command: `npm run build`, Output: `dist`
4. Add env var: `VITE_API_URL=https://your-backend.render.com/api`

### Backend → Render
1. New Web Service → connect repo
2. Root Directory: `backend`
3. Build: `npm install`, Start: `npm start`
4. Add all env vars from `backend/.env`

### Database → PlanetScale / Railway / Aiven
Run the SQL schema on your hosted MySQL instance.
