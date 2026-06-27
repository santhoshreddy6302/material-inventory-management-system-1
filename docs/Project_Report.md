# Project Report — Material Inventory Management System

## Executive Summary

The Material Inventory Management System (MIMS) is an industry-grade full-stack web application developed for AVINASH KANAPARTHI INFRA PRIVATE LIMITED to digitize and streamline the management of construction materials across multiple projects and sites. The system replaces manual spreadsheet-based tracking with a centralized, real-time platform accessible by multiple roles simultaneously.

---

## Problem Statement

Construction companies face significant challenges in material management:

- **Uncontrolled wastage** averaging 5–15% of material costs
- **Stock-outs** causing project delays due to poor visibility
- **Duplicate purchases** from lack of centralized inventory view
- **No audit trail** for material consumption and accountability
- **Manual reporting** consuming hours of admin time weekly
- **Supplier coordination** inefficiencies leading to delayed deliveries

---

## Solution Overview

MIMS provides a unified platform that:
1. Tracks real-time inventory levels across all sites
2. Automates purchase order workflow with approval gates
3. Records material usage and wastage with cost analysis
4. Generates instant reports exportable to CSV/Excel
5. Alerts stakeholders automatically for low stock and approvals
6. Provides role-based access so every team member sees what they need

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  Dashboard │ Materials │ Inventory │ POs │ Reports  │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS / REST API
┌─────────────────────▼───────────────────────────────┐
│              Backend (Node.js + Express)             │
│  Auth │ Controllers │ Middleware │ Validators       │
└─────────────────────┬───────────────────────────────┘
                      │ MySQL2
┌─────────────────────▼───────────────────────────────┐
│                MySQL 8 Database                      │
│  23 tables │ Foreign keys │ Indexes │ Transactions  │
└─────────────────────────────────────────────────────┘
```

---

## Key Modules

### 1. Authentication & Authorization
- JWT-based stateless authentication with 7-day token expiry
- Passwords hashed with bcrypt (12 salt rounds)
- 5 distinct roles with granular permission enforcement at API level
- Activity logging for all create/update/delete operations

### 2. Material Management
- Full CRUD with code auto-generation (e.g., MAT-A1B2C3)
- Category management with color coding
- Supplier linking and threshold configuration
- Soft-delete via is_active flag to preserve history

### 3. Inventory Engine
- Site-wise stock maintained in the `inventory` table
- Every stock movement recorded as an immutable transaction in `inventory_transactions`
- Automatic alert generation when stock falls below minimum threshold
- Stock transfer between sites with approval workflow

### 4. Purchase Order Workflow
```
Draft → Pending Approval → Approved → Ordered → Received
                        ↘ Cancelled
```
On "Received" status: inventory is automatically updated for the associated site, and inventory transaction records are created.

### 5. Usage & Wastage Tracking
- Deducts directly from site inventory upon recording
- Cost calculation using material's current unit price
- Wastage categorized by reason and preventability for analysis

### 6. Dashboard Analytics
- Built with Chart.js via react-chartjs-2
- 7 chart types: bar, line, doughnut, horizontal bar
- All data fetched from dedicated dashboard API endpoints
- KPI cards with contextual color coding

### 7. Site Management & Operations
- Site progress reporting and percentage tracking
- Subcontractor task and timeline management
- Equipment and machinery allocation to sites

### 8. Financial Management
- Client enquiries and conversion tracking
- Payment milestone scheduling and invoicing
- Project expense tracking by category

### 9. Labour Management
- Daily labour attendance and headcounts
- Skilled and unskilled worker tracking
- Wage calculations and payment logging

### 10. Reports Engine
- Server-side data aggregation with date/site filters
- CSV: streaming text response, direct browser download
- Excel: generated with ExcelJS, styled headers, color-coded rows
- Report types: Inventory, Purchase, Usage, Wastage, Activity Logs

---

## Database Design Highlights

| Design Decision | Rationale |
|---|---|
| Separate `inventory` table from `materials` | Allows site-wise stock with single material definition |
| Immutable `inventory_transactions` ledger | Full audit trail, stock can be reconstructed from zero |
| Composite unique key `(material_id, site_id)` | Prevents duplicate site-material inventory rows |
| `ON DELETE CASCADE` for PO items | Keeps data clean when orders are deleted |
| `ON DELETE SET NULL` for soft references | Preserves historical data when users/projects are deleted |
| JSON columns in activity_logs | Flexible old/new value storage without schema changes |

---

## Security Implementation

- **Authentication:** JWT with expiry enforcement
- **Authorization:** Role check middleware on every protected route
- **Input Validation:** express-validator on all POST/PUT endpoints
- **SQL Injection Prevention:** Parameterized queries exclusively (no string concatenation)
- **Password Security:** bcrypt with cost factor 12
- **CORS:** Restricted to configured frontend origin
- **Helmet.js:** Security HTTP headers on all responses
- **Error Handling:** Production mode suppresses stack traces

---

## Performance Optimizations

- Database connection pooling (10 connections)
- Composite indexes on frequently joined columns
- Pagination on all list endpoints (default 10–15 per page)
- Frontend code splitting: vendor and charts in separate chunks
- React state management without heavy libraries (Context API only)
- Minimal re-renders via selective state updates

---

## File & Folder Count

| Area | Files |
|---|---|
| Backend controllers | 11 |
| Backend routes | 13 |
| Backend middleware | 4 |
| Frontend pages | 16 |
| Frontend components | 9 |
| Frontend services | 12 |
| Database | 1 SQL schema + 1 seed script |
| Documentation | 4 |

---

## Testing Notes

The application has been designed for easy testing:

- **Seed data** provides realistic multi-project, multi-site scenarios
- **Demo accounts** for all 5 roles accessible via Login page shortcuts
- **Health check** endpoint at `/api/health` for deployment verification
- All API responses follow a consistent structure for predictable client handling

---

## Future Enhancements

1. **Mobile App** — React Native companion for site engineers
2. **Barcode/QR Scanning** — Material receiving with scan
3. **Budget Tracking** — PO budget vs actual spend analysis
4. **Vendor Portal** — Supplier self-service for delivery updates
5. **ML-based Forecasting** — Predict reorder dates from usage trends
6. **Offline Support** — PWA with sync for low-connectivity sites
7. **PDF Generation** — Printable PO documents with letterhead
8. **Email Notifications** — SMTP alerts for critical stock events

---

## Conclusion

MIMS delivers a production-ready system that addresses the core pain points of construction material management. The modular architecture allows individual components to be extended independently, and the comprehensive API documentation enables integration with third-party ERP or accounting systems.
