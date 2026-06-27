# Material Inventory Management System

A full-stack, industry-level Material Inventory Management System for construction companies, built with React 18, Node.js, Express, and MySQL.

---

## ⚡ Quick Start (3 Steps)

```bash
# Step 1 — Database
mysql -u root -p < database/material_inventory.sql

# Step 2 — Configure
cd backend && copy .env.example .env   # Edit DB_PASSWORD and JWT_SECRET
cd ..

# Step 3 — Install & Run
npm install            # install concurrently (root tool)
npm run install:all    # install backend + frontend dependencies
npm run seed           # seed database with demo data
npm run dev            # starts BOTH backend (:5000) + frontend (:5173)
```

Open **http://localhost:5173** — Login: `admin@constco.com` / `Admin@123`

---

## ⚠️ Common Mistake

**❌ Wrong:** Running `npm run dev` from the root folder WITHOUT running `npm install` first.

**✅ Right:**
```bash
# From root material-inventory/ directory:
npm install         ← REQUIRED FIRST (installs concurrently)
npm run install:all ← installs backend & frontend packages
npm run dev         ← now this works!
```

---

## ✨ Features

| Module | Features |
|---|---|
| **Dashboard** | Real-time KPI cards, 4 Chart.js charts, activity feed |
| **Materials** | CRUD, categories, threshold management, supplier linking |
| **Inventory** | Site-wise stock, immutable ledger, adjustments, transfers |
| **Purchase Orders** | Create → Approve → Receive with auto inventory update |
| **Usage Tracking** | Record consumption, auto-deduct inventory, cost tracking |
| **Wastage** | Log by reason, preventability, cost analysis |
| **Projects & Sites** | Multi-project multi-site management, site progress |
| **Suppliers** | Database with order history and spend tracking |
| **Labour** | Labour attendance and wage tracking |
| **Financials** | Payment milestones, project expenses, client enquiries |
| **Equipment** | Track equipment and machinery assignments at sites |
| **Subcontractors** | Manage subcontractor tasks and costs |
| **Reports** | Export to CSV / Excel with date & site filters |
| **Alerts** | Auto low-stock & PO-approval notifications |
| **User Management** | 5 roles with JWT authentication and RBAC |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Chart.js, Axios, React Router v6
- **Backend:** Node.js, Express.js, MySQL2, JWT, bcryptjs, ExcelJS, Winston
- **Database:** MySQL 8+

## 👥 User Roles

| Role | Key Permissions |
|---|---|
| Admin | Full access, user management |
| Project Manager | Projects, sites, PO approval |
| Site Engineer | Usage/wastage recording, stock transfers |
| Procurement Staff | Materials, suppliers, purchase orders |
| Accounts Staff | View reports, payment status |

---

## 📁 Project Structure

```
material-inventory/
├── backend/               # Node.js + Express API
│   ├── config/            # DB connection, app config
│   ├── controllers/       # 11 route handler files
│   ├── middleware/        # Auth, validation, error, logging
│   ├── routes/            # 13 Express router files
│   ├── utils/             # Logger, response helper, helpers
│   └── database/seed.js   # Database seeder
├── frontend/              # React + Vite SPA
│   └── src/
│       ├── components/    # Reusable UI (DataTable, Modal, etc.)
│       ├── context/       # Auth & Theme context
│       ├── layouts/       # Sidebar, Navbar, MainLayout
│       ├── pages/         # 16 page components
│       ├── services/      # 12 Axios API service files
│       └── utils/         # Helpers, formatters, constants
├── database/              # MySQL schema + seed data
│   └── material_inventory.sql
├── docs/                  # Documentation
│   ├── README.md
│   ├── Setup_Guide.md
│   ├── API_Documentation.md
│   └── Project_Report.md
└── package.json           # Root convenience scripts
```

---

## 🔐 Environment Variables

**`backend/.env`:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=material_inventory
JWT_SECRET=your_long_random_secret_min_32_chars
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 Database — 23 Tables

`users` · `projects` · `sites` · `material_categories` · `suppliers` · `materials` · `inventory` · `inventory_transactions` · `purchase_orders` · `purchase_order_items` · `material_usage` · `wastage_records` · `stock_transfers` · `alerts` · `activity_logs` · `site_progress` · `equipment_machinery` · `subcontractor_tasks` · `payment_milestones` · `client_enquiries` · `project_expenses` · `labour_wages` · `labour_attendance`

---

© 2024 AVINASH KANAPARTHI INFRA PRIVATE LIMITED — Material Inventory Management System v1.0
