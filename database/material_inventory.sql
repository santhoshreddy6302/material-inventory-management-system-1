-- ============================================================
-- MATERIAL INVENTORY MANAGEMENT SYSTEM - MySQL Schema
-- Construction Company Database
-- ============================================================

CREATE DATABASE IF NOT EXISTS material_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE material_inventory;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS site_progress;
DROP TABLE IF EXISTS equipment_machinery;
DROP TABLE IF EXISTS subcontractor_tasks;
DROP TABLE IF EXISTS payment_milestones;
DROP TABLE IF EXISTS client_enquiries;
DROP TABLE IF EXISTS project_expenses;
DROP TABLE IF EXISTS labour_wages;
DROP TABLE IF EXISTS labour_attendance;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS stock_transfers;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS wastage_records;
DROP TABLE IF EXISTS material_usage;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS material_categories;
DROP TABLE IF EXISTS sites;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','project_manager','site_engineer','procurement_staff','accounts_staff') NOT NULL DEFAULT 'site_engineer',
  phone VARCHAR(20),
  avatar VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
);

-- ============================================================
-- PROJECTS TABLE
-- ============================================================
CREATE TABLE projects (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(300),
  client_name VARCHAR(200),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2) DEFAULT 0,
  status ENUM('planning','active','completed','on_hold','cancelled') DEFAULT 'planning',
  stage VARCHAR(100) DEFAULT 'foundation',
  manager_id INT UNSIGNED,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_manager (manager_id)
);

-- ============================================================
-- SITES TABLE
-- ============================================================
CREATE TABLE sites (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  site_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  location VARCHAR(300),
  address TEXT,
  project_id INT UNSIGNED,
  engineer_id INT UNSIGNED,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (engineer_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_project (project_id),
  INDEX idx_active (is_active)
);

-- ============================================================
-- MATERIAL CATEGORIES
-- ============================================================
CREATE TABLE material_categories (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SUPPLIERS TABLE
-- ============================================================
CREATE TABLE suppliers (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  gst_number VARCHAR(50),
  payment_terms VARCHAR(100),
  credit_limit DECIMAL(15,2) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  rating DECIMAL(2,1) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_name (name)
);

-- ============================================================
-- MATERIALS TABLE
-- ============================================================
CREATE TABLE materials (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  material_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category_id INT UNSIGNED,
  description TEXT,
  unit VARCHAR(50) NOT NULL,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_threshold DECIMAL(10,2) NOT NULL DEFAULT 0,
  reorder_quantity DECIMAL(10,2) DEFAULT 0,
  supplier_id INT UNSIGNED,
  specifications TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES material_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX idx_category (category_id),
  INDEX idx_active (is_active),
  INDEX idx_name (name)
);

-- ============================================================
-- INVENTORY TABLE (Site-wise stock)
-- ============================================================
CREATE TABLE inventory (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  material_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  current_stock DECIMAL(12,3) DEFAULT 0,
  reserved_stock DECIMAL(12,3) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_material_site (material_id, site_id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  INDEX idx_material (material_id),
  INDEX idx_site (site_id)
);

-- ============================================================
-- INVENTORY TRANSACTIONS (Stock Ledger)
-- ============================================================
CREATE TABLE inventory_transactions (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  inventory_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  transaction_type ENUM('purchase','usage','wastage','transfer_in','transfer_out','adjustment') NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  balance_after DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  reference_id INT UNSIGNED,
  reference_type VARCHAR(50),
  notes TEXT,
  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_material_site (material_id, site_id),
  INDEX idx_type (transaction_type),
  INDEX idx_created_at (created_at)
);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
CREATE TABLE purchase_orders (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  project_id INT UNSIGNED,
  site_id INT UNSIGNED,
  order_date DATE NOT NULL,
  expected_delivery DATE,
  actual_delivery DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status ENUM('draft','pending_approval','approved','ordered','partially_received','received','cancelled') DEFAULT 'draft',
  payment_status ENUM('pending','partial','paid') DEFAULT 'pending',
  delivery_address TEXT,
  terms_conditions TEXT,
  notes TEXT,
  created_by INT UNSIGNED NOT NULL,
  approved_by INT UNSIGNED,
  approved_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_supplier (supplier_id),
  INDEX idx_status (status),
  INDEX idx_date (order_date)
);

-- ============================================================
-- PURCHASE ORDER ITEMS
-- ============================================================
CREATE TABLE purchase_order_items (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  po_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  received_quantity DECIMAL(12,3) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  INDEX idx_po (po_id),
  INDEX idx_material (material_id)
);

-- ============================================================
-- MATERIAL USAGE
-- ============================================================
CREATE TABLE material_usage (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  usage_code VARCHAR(50) UNIQUE NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  quantity_used DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  usage_date DATE NOT NULL,
  purpose VARCHAR(300),
  work_type VARCHAR(100),
  floor_level VARCHAR(50),
  remarks TEXT,
  recorded_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  INDEX idx_site (site_id),
  INDEX idx_material (material_id),
  INDEX idx_date (usage_date)
);

-- ============================================================
-- WASTAGE RECORDS
-- ============================================================
CREATE TABLE wastage_records (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  wastage_code VARCHAR(50) UNIQUE NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  quantity_wasted DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  wastage_date DATE NOT NULL,
  reason ENUM('damage','expired','spill','cutting_loss','quality_issue','theft','other') NOT NULL,
  description TEXT,
  preventable TINYINT(1) DEFAULT 0,
  remarks TEXT,
  recorded_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  INDEX idx_site (site_id),
  INDEX idx_material (material_id),
  INDEX idx_date (wastage_date)
);

-- ============================================================
-- STOCK TRANSFERS
-- ============================================================
CREATE TABLE stock_transfers (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  transfer_code VARCHAR(50) UNIQUE NOT NULL,
  from_site_id INT UNSIGNED NOT NULL,
  to_site_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  transfer_date DATE NOT NULL,
  status ENUM('pending','in_transit','completed','cancelled') DEFAULT 'pending',
  reason TEXT,
  requested_by INT UNSIGNED NOT NULL,
  approved_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_site_id) REFERENCES sites(id),
  FOREIGN KEY (to_site_id) REFERENCES sites(id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE alerts (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  type ENUM('low_stock','out_of_stock','po_approval','delivery_due','budget_exceeded','high_wastage') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  material_id INT UNSIGNED,
  site_id INT UNSIGNED,
  po_id INT UNSIGNED,
  is_read TINYINT(1) DEFAULT 0,
  is_resolved TINYINT(1) DEFAULT 0,
  severity ENUM('low','medium','high','critical') DEFAULT 'medium',
  resolved_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  INDEX idx_type (type),
  INDEX idx_read (is_read),
  INDEX idx_severity (severity)
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE activity_logs (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED,
  user_name VARCHAR(100),
  action VARCHAR(200) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT UNSIGNED,
  entity_name VARCHAR(200),
  description TEXT,
  ip_address VARCHAR(45),
  old_data JSON,
  new_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
);

-- ============================================================
-- LABOUR ATTENDANCE
-- ============================================================
CREATE TABLE labour_attendance (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  site_id INT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  total_workers INT NOT NULL DEFAULT 0,
  skilled_workers INT NOT NULL DEFAULT 0,
  unskilled_workers INT NOT NULL DEFAULT 0,
  contractor_name VARCHAR(200),
  notes TEXT,
  recorded_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  INDEX idx_site_date (site_id, date)
);

-- ============================================================
-- LABOUR WAGES
-- ============================================================
CREATE TABLE labour_wages (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attendance_id INT UNSIGNED NOT NULL,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendance_id) REFERENCES labour_attendance(id) ON DELETE CASCADE
);

-- ============================================================
-- PROJECT EXPENSES
-- ============================================================
CREATE TABLE project_expenses (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  incurred_by VARCHAR(200),
  recorded_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- ============================================================
-- CLIENT ENQUIRIES
-- ============================================================
CREATE TABLE client_enquiries (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  client_name VARCHAR(200) NOT NULL,
  contact_info VARCHAR(200),
  enquiry_date DATE NOT NULL,
  details TEXT,
  status ENUM('new','in_progress','converted','closed') DEFAULT 'new',
  assigned_to INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PAYMENT MILESTONES
-- ============================================================
CREATE TABLE payment_milestones (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  milestone_name VARCHAR(200) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE,
  status ENUM('pending','invoiced','paid') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- ============================================================
-- SUBCONTRACTOR TASKS
-- ============================================================
CREATE TABLE subcontractor_tasks (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  subcontractor_name VARCHAR(200) NOT NULL,
  task_description TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status ENUM('pending','in_progress','completed') DEFAULT 'pending',
  cost DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- ============================================================
-- EQUIPMENT MACHINERY
-- ============================================================
CREATE TABLE equipment_machinery (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  site_id INT UNSIGNED NOT NULL,
  equipment_name VARCHAR(200) NOT NULL,
  model VARCHAR(100),
  status ENUM('active','maintenance','out_of_service') DEFAULT 'active',
  assigned_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- ============================================================
-- SITE PROGRESS
-- ============================================================
CREATE TABLE site_progress (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  site_id INT UNSIGNED NOT NULL,
  report_date DATE NOT NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  work_completed TEXT,
  issues_faced TEXT,
  reported_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (reported_by) REFERENCES users(id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default admin user (password: Admin@123)
INSERT INTO users (name, email, password, role, phone) VALUES
('System Admin', 'admin@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'admin', '9876543210'),
('Raj Kumar', 'pm@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'project_manager', '9876543211'),
('Amit Singh', 'engineer@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'site_engineer', '9876543212'),
('Priya Sharma', 'procurement@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'procurement_staff', '9876543213'),
('Sanjay Mehta', 'accounts@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'accounts_staff', '9876543214');

-- Material Categories
INSERT INTO material_categories (name, description, color) VALUES
('Cement & Concrete', 'Binding materials', '#78716C'),
('Steel & Metal', 'Structural metals', '#6B7280'),
('Bricks & Masonry', 'Wall construction', '#B45309'),
('Sand & Aggregates', 'Fine and coarse aggregates', '#D97706'),
('Tiles & Flooring', 'Floor and wall finishes', '#0891B2'),
('Pipes & Plumbing', 'Water and drainage', '#0284C7'),
('Electrical', 'Electrical components', '#7C3AED'),
('Wood & Timber', 'Wooden materials', '#92400E'),
('Paint & Chemicals', 'Surface treatment', '#059669'),
('Safety Equipment', 'PPE and safety', '#DC2626');

-- Suppliers
INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, city, state, gst_number, payment_terms) VALUES
('SUP-001', 'BuildMat Supplies Pvt Ltd', 'Rakesh Gupta', 'rakesh@buildmat.com', '9811234567', '12 Industrial Area, Sector 5', 'Delhi', 'Delhi', '07AABCB1234A1Z1', 'Net 30'),
('SUP-002', 'Steel Works India', 'Vikram Joshi', 'vikram@steelworks.in', '9822345678', '45 Metal Park, Bhosari', 'Pune', 'Maharashtra', '27AABCS5678B2Z2', 'Net 45'),
('SUP-003', 'Cement Traders Co', 'Meena Patel', 'meena@cementtrade.com', '9833456789', '78 Traders Hub, GIDC', 'Ahmedabad', 'Gujarat', '24AABCC9012C3Z3', 'Net 30'),
('SUP-004', 'Pipe Masters Ltd', 'Anand Rao', 'anand@pipemasters.com', '9844567890', '23 Plumbing Zone', 'Bangalore', 'Karnataka', '29AABCP3456D4Z4', 'Net 60'),
('SUP-005', 'Electro Supplies', 'Sunita Verma', 'sunita@electro.com', '9855678901', '56 Electronics Hub, Ambattur', 'Chennai', 'Tamil Nadu', '33AABCE7890E5Z5', 'Net 30');

-- Projects
INSERT INTO projects (project_code, name, description, location, client_name, start_date, end_date, budget, status, manager_id, created_by) VALUES
('PRJ-A1B2C3', 'Greenfield Residential Complex', '200-unit residential complex G+12 floors', 'Sector 45, Noida', 'Greenfield Developers', '2024-01-15', '2025-12-31', 25000000.00, 'active', 2, 1),
('PRJ-D4E5F6', 'City Mall Construction', 'Commercial shopping mall', 'MG Road, Bangalore', 'City Realty Ltd', '2024-03-01', '2026-03-31', 45000000.00, 'active', 2, 1),
('PRJ-G7H8I9', 'Industrial Warehouse Block A', 'Logistics warehouse complex', 'MIDC, Pune', 'LogiPark Pvt Ltd', '2023-06-01', '2024-11-30', 12000000.00, 'completed', 2, 1),
('PRJ-J1K2L3', 'Highway Bridge Repair', 'Structural repair and strengthening', 'NH-48, Km 234', 'NHAI', '2024-07-01', '2025-01-31', 8000000.00, 'active', 2, 1);

-- Sites
INSERT INTO sites (site_code, name, location, address, project_id, engineer_id) VALUES
('SITE-M4N5O6', 'Greenfield Block A', 'Sector 45, Noida', 'Plot 12, Sector 45, Noida - 201301', 1, 3),
('SITE-P7Q8R9', 'Greenfield Block B', 'Sector 45, Noida', 'Plot 13, Sector 45, Noida - 201301', 1, 3),
('SITE-S1T2U3', 'City Mall Main Site', 'MG Road, Bangalore', 'Survey No. 234, MG Road, Bangalore - 560001', 2, 3),
('SITE-V4W5X6', 'Warehouse Site Pune', 'MIDC, Pune', 'MIDC Phase II, Bhosari, Pune - 411026', 3, 3),
('SITE-Y7Z8A9', 'NH48 Bridge Site', 'NH-48 Km 234', 'National Highway 48, Km 234, Gurugram', 4, 3);

-- Materials
INSERT INTO materials (material_code, name, category_id, unit, description, cost_per_unit, minimum_threshold, reorder_quantity, supplier_id) VALUES
('MAT-C1D2E3', 'OPC 53 Grade Cement', 1, 'Bags (50kg)', 'Ordinary Portland Cement 53 grade', 380.00, 500, 2000, 3),
('MAT-F4G5H6', 'TMT Steel Bars Fe500', 2, 'Metric Ton', 'High strength TMT reinforcement bars 8-32mm', 62000.00, 10, 50, 2),
('MAT-I7J8K9', 'Red Clay Bricks', 3, '1000 nos', 'Standard red clay bricks 230x115x75mm', 7500.00, 50, 200, 1),
('MAT-L1M2N3', 'River Sand (Fine)', 4, 'Cubic Meter', 'Clean river sand for plastering & concreting', 1800.00, 20, 100, 1),
('MAT-O4P5Q6', 'Crushed Stone 20mm', 4, 'Cubic Meter', 'Machine crushed stone aggregate 20mm', 1600.00, 15, 80, 1),
('MAT-R7S8T9', 'Vitrified Floor Tiles 600x600', 5, 'Sq Meter', 'Premium vitrified tiles 600x600mm white gloss', 480.00, 200, 1000, 1),
('MAT-U1V2W3', 'CPVC Pipe 25mm', 6, 'Meters', 'CPVC hot & cold water pipes 25mm dia', 120.00, 500, 2000, 4),
('MAT-X4Y5Z6', 'PVC Electrical Conduit 25mm', 7, 'Meters', 'Rigid PVC conduit for wiring', 45.00, 1000, 5000, 5),
('MAT-A7B8C9', 'Electrical Copper Wire 2.5sqmm', 7, 'Meters', 'Flexible copper conductor 2.5 sqmm FR', 35.00, 2000, 8000, 5),
('MAT-D1E2F3', 'ACC Hollow Blocks 200mm', 3, '1000 nos', 'Autoclaved Aerated Concrete hollow blocks', 9500.00, 20, 100, 1),
('MAT-G4H5I6', 'Plywood 18mm BWR', 8, 'Sheets', '18mm BWR grade plywood 8x4 ft', 1800.00, 50, 200, 1),
('MAT-J7K8L9', 'Waterproof Paint (Exterior)', 9, 'Liters', 'Premium weather proof exterior emulsion paint', 220.00, 100, 500, 1);
