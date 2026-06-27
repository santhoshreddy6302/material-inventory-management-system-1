# Material Inventory Management System 🏗️

A comprehensive, enterprise-level full-stack web application designed for construction and manufacturing companies to seamlessly track, manage, and optimize their material inventory, procurement, and usage.

## 🌟 Features

- **Robust Dashboard**: Real-time insights, stock valuation, and trend analytics using Recharts.
- **Inventory Management**: Comprehensive tracking of materials across multiple sites, transfers, usage, and wastage logging.
- **Procurement & POs**: Full Purchase Order lifecycle management, supplier integration, and delivery tracking.
- **Subcontractors & Machinery**: Manage heavy machinery allocations and subcontractor milestone payments.
- **Role-Based Access Control**: Secure JWT authentication with customized views for Admins, Project Managers, Site Engineers, and Procurement Staff.
- **AI Forecasting**: Intelligent insights for material requirement forecasting.
- **Export & Reporting**: Generate extensive Excel and PDF reports.
- **Production Ready**: Fully Dockerized with automated CI/CD pipelines for Vercel and Render deployment.

## 🛠️ Tech Stack

**Frontend**
- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS** + **Shadcn UI** (Premium Glassmorphism Design)
- **React Hook Form** + **Zod** (Type-safe form validation)
- **Recharts** (Data Visualization)
- **Axios** (API Requests)

**Backend**
- **Node.js** + **Express.js** + **TypeScript**
- **Prisma ORM**
- **Database**: TiDB Cloud (MySQL-compatible) via Prisma ORM
- **JWT** (Authentication)
- **PDFKit** & **ExcelJS** (Reporting)

---

## 🚀 Quick Start (Dockerized)

The absolute easiest way to run the entire enterprise suite is using Docker. It requires zero configuration.

```bash
git clone <repo-url>
cd material-inventory-final
docker-compose up --build
```
- **Frontend** will run on `http://localhost:5173`
- **Backend API** will run on `http://localhost:5000`

---

## 💻 Manual Local Development (TiDB Cloud)

The backend uses TiDB Cloud through Prisma's MySQL connector.

1. **Setup & Seed Backend**
   ```bash
   cd backend
   npm install
   copy .env.example .env
   # Paste the Prisma connection string from TiDB Cloud into DATABASE_URL
   npx prisma generate
   npm run db:check
   npm run db:push
   npm run seed
   npm run dev
   ```

   In TiDB Cloud, open the cluster, choose **Connect > Prisma**, and copy its
   connection string. TiDB Cloud Starter public endpoints require
   `sslaccept=strict`. `npm run db:push` creates the tables. The seed command
   deletes existing rows first, so only run it when demo data is wanted.

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

### 🔑 Test Credentials
Use the following credentials to access the seeded database:
- **Admin**: `admin@constco.com` | `Admin@123`
- **Project Manager**: `pm@constco.com` | `Admin@123`
- **Site Engineer**: `engineer@constco.com` | `Admin@123`
- **Procurement**: `procurement@constco.com` | `Admin@123`

---

## 🌍 Production Deployment

The codebase is fully equipped with CI/CD pipelines (`.github/workflows/ci.yml`) and configuration files (`vercel.json`, `render.yaml`) to automatically deploy to Vercel (Frontend) and Render (Backend).

### TiDB Cloud in Production

Set `DATABASE_URL` in the backend hosting environment to the same TiDB Cloud
Prisma connection string. Keep the password out of source control; `.env` is
already ignored by Git.

---

## 🏗️ Architecture

- **`/backend`**: RESTful API structure with controllers, routes, middleware, and Prisma schema.
- **`/frontend/src`**: React application utilizing contexts for state management, custom hooks, and modular UI components built with Shadcn.
- **`/frontend/src/pages`**: Segregated by 17 functional modules (e.g., Inventory, Purchase, Reporting, Users).

## 🔒 Security
- Password Hashing with **Bcrypt**
- Route protection with custom JWT auth middleware
- Input validation using **express-validator** on the backend and **Zod** on the frontend
- XSS and Clickjacking prevention via Vercel security headers

## 📝 License
This project is proprietary and confidential.
