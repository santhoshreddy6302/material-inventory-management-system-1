# API Documentation — Material Inventory Management System

**Base URL:** `http://localhost:5000/api`

All endpoints (except `/auth/login`) require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Standard Response Format

```json
{ "success": true, "message": "Success", "data": {}, "timestamp": "2024-01-01T00:00:00.000Z" }
```

Paginated:
```json
{ "success": true, "data": [], "pagination": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 } }
```

Error:
```json
{ "success": false, "message": "Error description", "errors": [] }
```

---

## 🔐 Authentication

### POST /auth/login
```json
// Request
{ "email": "admin@constco.com", "password": "Admin@123" }

// Response
{ "token": "eyJ...", "user": { "id": 1, "name": "Admin", "role": "admin" } }
```

### GET /auth/me
Returns current authenticated user.

### PUT /auth/profile
```json
{ "name": "New Name", "phone": "9876543210" }
```

### PUT /auth/password
```json
{ "currentPassword": "old", "newPassword": "new_min6" }
```

---

## 📦 Materials

### GET /materials
Query: `?page=1&limit=10&search=cement&category_id=1&is_active=true`

### GET /materials/low-stock
Returns materials below minimum threshold.

### GET /materials/categories
Returns all material categories.

### POST /materials/categories
```json
{ "name": "Cement", "description": "...", "color": "#78716C" }
```

### GET /materials/:id

### POST /materials *(admin, procurement)*
```json
{
  "name": "OPC 53 Grade Cement",
  "category_id": 1,
  "unit": "Bags (50kg)",
  "cost_per_unit": 380,
  "minimum_threshold": 500,
  "reorder_quantity": 2000,
  "supplier_id": 3,
  "description": "..."
}
```

### PUT /materials/:id
### DELETE /materials/:id *(admin only)*

---

## 🏭 Inventory

### GET /inventory
Query: `?page=1&limit=15&site_id=1&low_stock=true&search=`

### GET /inventory/site/:site_id
All stock for a specific site.

### GET /inventory/transactions
Query: `?material_id=1&site_id=1&transaction_type=purchase&from_date=2024-01-01&to_date=2024-12-31`

Transaction types: `purchase | usage | wastage | transfer_in | transfer_out | adjustment`

### POST /inventory/adjust *(admin, procurement, engineer)*
```json
{ "material_id": 1, "site_id": 1, "quantity": 50, "notes": "Physical count adjustment" }
```
Use negative quantity to deduct.

---

## 🛒 Purchase Orders

### GET /purchase-orders
Query: `?status=pending_approval&supplier_id=1&from_date=&to_date=`

Status values: `draft | pending_approval | approved | ordered | partially_received | received | cancelled`

### GET /purchase-orders/:id
Returns PO with all line items.

### POST /purchase-orders *(admin, procurement, PM)*
```json
{
  "supplier_id": 1,
  "project_id": 1,
  "site_id": 1,
  "order_date": "2024-01-15",
  "expected_delivery": "2024-01-25",
  "notes": "Urgent delivery",
  "items": [
    { "material_id": 1, "quantity": 500, "unit_price": 380, "tax_percentage": 18 },
    { "material_id": 2, "quantity": 10, "unit_price": 62000 }
  ]
}
```

### PUT /purchase-orders/:id/status
```json
{ "status": "approved", "notes": "Approved by PM" }
```
Valid transitions: `draft→pending_approval→approved→ordered→received`
Receiving a PO automatically updates site inventory.

### DELETE /purchase-orders/:id *(draft/cancelled only)*

---

## 🔧 Material Usage

### GET /usage
Query: `?site_id=1&material_id=1&from_date=&to_date=&search=`

### POST /usage *(admin, engineer, PM)*
```json
{
  "site_id": 1,
  "material_id": 1,
  "quantity_used": 120,
  "usage_date": "2024-01-15",
  "purpose": "Foundation concreting",
  "work_type": "Civil",
  "floor_level": "Basement",
  "remarks": "..."
}
```
Auto-deducts from inventory and creates transaction log.

### GET /usage/stats
Query: `?site_id=1&from_date=&to_date=`
Returns usage by material, by site, and monthly trend.

---

## 🗑️ Wastage Records

### GET /wastage
Query: `?site_id=1&reason=damage&from_date=&to_date=`

### POST /wastage *(admin, engineer, PM)*
```json
{
  "site_id": 1,
  "material_id": 1,
  "quantity_wasted": 15,
  "wastage_date": "2024-01-15",
  "reason": "spill",
  "description": "Cement bag torn during unloading",
  "preventable": true,
  "remarks": "..."
}
```
Reason values: `damage | expired | spill | cutting_loss | quality_issue | theft | other`

### GET /wastage/stats

---

## 📁 Projects

### GET /projects?status=active
### GET /projects/:id (includes sites)
### POST /projects *(admin, PM)*
```json
{
  "name": "Tower Block A", "client_name": "ABC Developers",
  "location": "Noida", "start_date": "2024-01-01",
  "end_date": "2025-12-31", "budget": 25000000,
  "status": "active", "manager_id": 2
}
```
### PUT /projects/:id
### DELETE /projects/:id

---

## 📍 Sites

### GET /sites/all  *(simple list — id, name, site_code)*
### GET /sites
### POST /sites *(admin, PM)*
```json
{ "name": "Block A", "location": "Sector 45, Noida", "address": "...", "project_id": 1 }
```
### PUT /sites/:id
### DELETE /sites/:id

---

## 🚚 Suppliers

### GET /suppliers/all  *(simple list)*
### GET /suppliers
### POST /suppliers *(admin, procurement)*
```json
{
  "name": "BuildMat Pvt Ltd", "contact_person": "Rakesh",
  "email": "r@buildmat.com", "phone": "9811234567",
  "address": "...", "city": "Delhi", "state": "Delhi",
  "gst_number": "07AABCB1234A1Z1", "payment_terms": "Net 30"
}
```
### PUT /suppliers/:id
### DELETE /suppliers/:id

---

## 🔄 Stock Transfers

### GET /transfers
### POST /transfers *(admin, engineer, PM)*
```json
{
  "from_site_id": 1, "to_site_id": 2,
  "material_id": 1, "quantity": 100,
  "transfer_date": "2024-01-15", "reason": "Excess stock at Site A"
}
```
### PUT /transfers/:id/status
```json
{ "status": "completed" }
```
Completing a transfer automatically moves stock between sites.

---

## 📊 Dashboard

All GET, authenticated.

| Endpoint | Returns |
|---|---|
| `GET /dashboard/stats` | KPI cards data |
| `GET /dashboard/inventory-trend` | 30-day stock movements |
| `GET /dashboard/usage-by-category` | Monthly usage by category |
| `GET /dashboard/wastage-analysis` | Wastage by reason |
| `GET /dashboard/site-consumption` | Site-wise usage vs wastage |
| `GET /dashboard/monthly-trend` | 12-month purchases vs usage |
| `GET /dashboard/recent-activity` | Last 20 activity logs |
| `GET /dashboard/low-stock` | Low stock items |

---

## 📑 Reports

Query params: `?from_date=2024-01-01&to_date=2024-12-31&site_id=1&format=csv|excel`

| Endpoint | Description |
|---|---|
| `GET /reports/inventory` | Stock levels, values, status |
| `GET /reports/purchase` | Purchase order history |
| `GET /reports/usage` | Usage records |
| `GET /reports/wastage` | Wastage records |
| `GET /reports/activity-logs` | System audit trail |

**Export:** Append `?format=csv` or `?format=excel` to download.

---

## 🔔 Alerts

### GET /alerts
Query: `?type=low_stock&severity=critical&is_read=false&is_resolved=false`

### GET /alerts/unread-count
Returns `{ "count": 5 }`

### PUT /alerts/mark-read
```json
{ "ids": [1, 2, 3] }   // or empty body for mark all read
```

### PUT /alerts/:id/resolve

---

## 👥 Users *(Admin only)*

### GET /users?role=site_engineer&is_active=true
### POST /users
```json
{ "name": "John Doe", "email": "john@co.com", "password": "pass123", "role": "site_engineer", "phone": "..." }
```
### PUT /users/:id
### PUT /users/:id/reset-password
```json
{ "password": "newpass123" }
```

---

## 📈 Site Progress

### GET /site-progress
### POST /site-progress
```json
{ "site_id": 1, "report_date": "2024-01-15", "progress_percentage": 10.5, "work_completed": "...", "issues_faced": "..." }
```
### PUT /site-progress/:id
### DELETE /site-progress/:id

---

## 🚜 Equipment & Machinery

### GET /equipment
### POST /equipment
```json
{ "site_id": 1, "equipment_name": "Excavator", "model": "CAT-320", "status": "active", "assigned_date": "2024-01-01" }
```
### PUT /equipment/:id
### DELETE /equipment/:id

---

## 🤝 Subcontractor Tasks

### GET /subcontractor-tasks
### POST /subcontractor-tasks
```json
{ "project_id": 1, "subcontractor_name": "ABC Construction", "task_description": "...", "start_date": "2024-01-01", "end_date": "2024-02-01", "status": "in_progress", "cost": 500000 }
```
### PUT /subcontractor-tasks/:id
### DELETE /subcontractor-tasks/:id

---

## 💰 Payment Milestones

### GET /payment-milestones
### POST /payment-milestones
```json
{ "project_id": 1, "milestone_name": "Foundation completion", "amount": 1000000, "due_date": "2024-02-01", "status": "pending" }
```
### PUT /payment-milestones/:id
### DELETE /payment-milestones/:id

---

## 💵 Project Expenses

### GET /project-expenses
### POST /project-expenses
```json
{ "project_id": 1, "category": "Travel", "amount": 5000, "expense_date": "2024-01-15", "description": "...", "incurred_by": "John" }
```
### PUT /project-expenses/:id
### DELETE /project-expenses/:id

---

## 📞 Client Enquiries

### GET /client-enquiries
### POST /client-enquiries
```json
{ "client_name": "XYZ Corp", "contact_info": "...", "enquiry_date": "2024-01-15", "details": "...", "status": "new", "assigned_to": 1 }
```
### PUT /client-enquiries/:id
### DELETE /client-enquiries/:id

---

## 👷 Labour Management

### GET /labour/attendance
### POST /labour/attendance
```json
{ "site_id": 1, "date": "2024-01-15", "total_workers": 50, "skilled_workers": 20, "unskilled_workers": 30, "contractor_name": "ABC" }
```
### PUT /labour/attendance/:id
### DELETE /labour/attendance/:id

### GET /labour/wages
### POST /labour/wages
```json
{ "attendance_id": 1, "amount_paid": 25000, "payment_date": "2024-01-15", "payment_method": "Bank Transfer" }
```
### PUT /labour/wages/:id
### DELETE /labour/wages/:id

---

## 🤖 AI Routes

### POST /ai/predict-usage
```json
{ "site_id": 1, "material_id": 1, "horizon_days": 30 }
```
Returns predicted material usage for the next N days.

### POST /ai/anomaly-detection
Analyzes recent inventory transactions for anomalies.

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate/referenced) |
| 422 | Validation Failed |
| 500 | Internal Server Error |
