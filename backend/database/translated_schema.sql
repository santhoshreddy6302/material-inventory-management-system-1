PRAGMA foreign_keys = OFF;
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
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role TEXT NOT NULL DEFAULT 'site_engineer',
  phone VARCHAR(20),
  avatar VARCHAR(255),
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP 
);
CREATE INDEX IF NOT EXISTS idx_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_active ON users (is_active);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(300),
  client_name VARCHAR(200),
  start_date DATE,
  end_date DATE,
  budget REAL DEFAULT 0,
  status TEXT DEFAULT 'planning',
  stage VARCHAR(100) DEFAULT 'foundation',
  manager_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_manager ON projects (manager_id);
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  location VARCHAR(300),
  address TEXT,
  project_id INTEGER,
  engineer_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (engineer_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_project ON sites (project_id);
CREATE INDEX IF NOT EXISTS idx_active ON sites (is_active);
CREATE TABLE IF NOT EXISTS material_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP 
);
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  credit_limit REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  rating REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP 
);
CREATE INDEX IF NOT EXISTS idx_active ON suppliers (is_active);
CREATE INDEX IF NOT EXISTS idx_name ON suppliers (name);
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category_id INTEGER,
  description TEXT,
  unit VARCHAR(50) NOT NULL,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  minimum_threshold REAL NOT NULL DEFAULT 0,
  reorder_quantity REAL DEFAULT 0,
  supplier_id INTEGER,
  specifications TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (category_id) REFERENCES material_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_category ON materials (category_id);
CREATE INDEX IF NOT EXISTS idx_active ON materials (is_active);
CREATE INDEX IF NOT EXISTS idx_name ON materials (name);
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL,
  site_id INTEGER NOT NULL,
  current_stock REAL DEFAULT 0,
  reserved_stock REAL DEFAULT 0,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP ,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (material_id, site_id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (site_id) REFERENCES sites(id)
);
CREATE INDEX IF NOT EXISTS idx_material ON inventory (material_id);
CREATE INDEX IF NOT EXISTS idx_site ON inventory (site_id);
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  site_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  quantity REAL NOT NULL,
  balance_after REAL NOT NULL,
  unit_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  reference_id INTEGER,
  reference_type VARCHAR(50),
  notes TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_material_site ON inventory_transactions (material_id, site_id);
CREATE INDEX IF NOT EXISTS idx_type ON inventory_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON inventory_transactions (created_at);
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL,
  project_id INTEGER,
  site_id INTEGER,
  order_date DATE NOT NULL,
  expected_delivery DATE,
  actual_delivery DATE,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  payment_status TEXT DEFAULT 'pending',
  delivery_address TEXT,
  terms_conditions TEXT,
  notes TEXT,
  created_by INTEGER NOT NULL,
  approved_by INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_supplier ON purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_status ON purchase_orders (status);
CREATE INDEX IF NOT EXISTS idx_date ON purchase_orders (order_date);
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  received_quantity REAL DEFAULT 0,
  tax_percentage REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id)
);
CREATE INDEX IF NOT EXISTS idx_po ON purchase_order_items (po_id);
CREATE INDEX IF NOT EXISTS idx_material ON purchase_order_items (material_id);
CREATE TABLE IF NOT EXISTS material_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usage_code VARCHAR(50) UNIQUE NOT NULL,
  site_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity_used REAL NOT NULL,
  unit_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  usage_date DATE NOT NULL,
  purpose VARCHAR(300),
  work_type VARCHAR(100),
  floor_level VARCHAR(50),
  remarks TEXT,
  recorded_by INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_site ON material_usage (site_id);
CREATE INDEX IF NOT EXISTS idx_material ON material_usage (material_id);
CREATE INDEX IF NOT EXISTS idx_date ON material_usage (usage_date);
CREATE TABLE IF NOT EXISTS wastage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wastage_code VARCHAR(50) UNIQUE NOT NULL,
  site_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity_wasted REAL NOT NULL,
  unit_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  wastage_date DATE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  preventable INTEGER DEFAULT 0,
  remarks TEXT,
  recorded_by INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_site ON wastage_records (site_id);
CREATE INDEX IF NOT EXISTS idx_material ON wastage_records (material_id);
CREATE INDEX IF NOT EXISTS idx_date ON wastage_records (wastage_date);
CREATE TABLE IF NOT EXISTS stock_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_code VARCHAR(50) UNIQUE NOT NULL,
  from_site_id INTEGER NOT NULL,
  to_site_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  transfer_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  requested_by INTEGER NOT NULL,
  approved_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (from_site_id) REFERENCES sites(id),
  FOREIGN KEY (to_site_id) REFERENCES sites(id),
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  material_id INTEGER,
  site_id INTEGER,
  po_id INTEGER,
  is_read INTEGER DEFAULT 0,
  is_resolved INTEGER DEFAULT 0,
  severity TEXT DEFAULT 'medium',
  resolved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  UNIQUE(type, material_id, site_id)
);
CREATE INDEX IF NOT EXISTS idx_type ON alerts (type);
CREATE INDEX IF NOT EXISTS idx_read ON alerts (is_read);
CREATE INDEX IF NOT EXISTS idx_severity ON alerts (severity);
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name VARCHAR(100),
  action VARCHAR(200) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  entity_name VARCHAR(200),
  description TEXT,
  ip_address VARCHAR(45),
  old_data JSON,
  new_data JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_user ON activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_entity ON activity_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON activity_logs (created_at);
CREATE TABLE IF NOT EXISTS labour_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  date DATE NOT NULL,
  total_workers INTEGER NOT NULL DEFAULT 0,
  skilled_workers INTEGER NOT NULL DEFAULT 0,
  unskilled_workers INTEGER NOT NULL DEFAULT 0,
  contractor_name VARCHAR(200),
  notes TEXT,
  recorded_by INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_site_date ON labour_attendance (site_id, date);
CREATE TABLE IF NOT EXISTS labour_wages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendance_id INTEGER NOT NULL,
  amount_paid REAL DEFAULT 0,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  remarks TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendance_id) REFERENCES labour_attendance(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS project_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount REAL NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  incurred_by VARCHAR(200),
  recorded_by INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS client_enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name VARCHAR(200) NOT NULL,
  contact_info VARCHAR(200),
  enquiry_date DATE NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'new',
  assigned_to INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS payment_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  milestone_name VARCHAR(200) NOT NULL,
  amount REAL NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
CREATE TABLE IF NOT EXISTS subcontractor_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  subcontractor_name VARCHAR(200) NOT NULL,
  task_description TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  cost REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
CREATE TABLE IF NOT EXISTS equipment_machinery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  equipment_name VARCHAR(200) NOT NULL,
  model VARCHAR(100),
  status TEXT DEFAULT 'active',
  assigned_date DATE,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);
CREATE TABLE IF NOT EXISTS site_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  report_date DATE NOT NULL,
  progress_percentage REAL DEFAULT 0,
  work_completed TEXT,
  issues_faced TEXT,
  reported_by INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (reported_by) REFERENCES users(id)
);
INSERT OR IGNORE INTO users (name, email, password, role, phone) VALUES
('System Admin', 'admin@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'admin', '9876543210'),
('Raj Kumar', 'pm@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'project_manager', '9876543211'),
('Amit Singh', 'engineer@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'site_engineer', '9876543212'),
('Priya Sharma', 'procurement@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'procurement_staff', '9876543213'),
('Sanjay Mehta', 'accounts@constco.com', '$2a$12$GksDrLFq10IjVuue2TTtoetpcHBlzmzTx6w6Qfv/HcMaiC3mTgWn6', 'accounts_staff', '9876543214');
INSERT OR IGNORE INTO material_categories (name, description, color) VALUES
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
INSERT OR IGNORE INTO suppliers (supplier_code, name, contact_person, email, phone, address, city, state, gst_number, payment_terms) VALUES
('SUP-001', 'BuildMat Supplies Pvt Ltd', 'Rakesh Gupta', 'rakesh@buildmat.com', '9811234567', '12 Industrial Area, Sector 5', 'Delhi', 'Delhi', '07AABCB1234A1Z1', 'Net 30'),
('SUP-002', 'Steel Works India', 'Vikram Joshi', 'vikram@steelworks.in', '9822345678', '45 Metal Park, Bhosari', 'Pune', 'Maharashtra', '27AABCS5678B2Z2', 'Net 45'),
('SUP-003', 'Cement Traders Co', 'Meena Patel', 'meena@cementtrade.com', '9833456789', '78 Traders Hub, GIDC', 'Ahmedabad', 'Gujarat', '24AABCC9012C3Z3', 'Net 30'),
('SUP-004', 'Pipe Masters Ltd', 'Anand Rao', 'anand@pipemasters.com', '9844567890', '23 Plumbing Zone', 'Bangalore', 'Karnataka', '29AABCP3456D4Z4', 'Net 60'),
('SUP-005', 'Electro Supplies', 'Sunita Verma', 'sunita@electro.com', '9855678901', '56 Electronics Hub, Ambattur', 'Chennai', 'Tamil Nadu', '33AABCE7890E5Z5', 'Net 30');
INSERT OR IGNORE INTO projects (project_code, name, description, location, client_name, start_date, end_date, budget, status, manager_id, created_by) VALUES
('PRJ-A1B2C3', 'Greenfield Residential Complex', '200-unit residential complex G+12 floors', 'Sector 45, Noida', 'Greenfield Developers', '2024-01-15', '2025-12-31', 25000000.00, 'active', 2, 1),
('PRJ-D4E5F6', 'City Mall Construction', 'Commercial shopping mall', 'MG Road, Bangalore', 'City Realty Ltd', '2024-03-01', '2026-03-31', 45000000.00, 'active', 2, 1),
('PRJ-G7H8I9', 'Industrial Warehouse Block A', 'Logistics warehouse complex', 'MIDC, Pune', 'LogiPark Pvt Ltd', '2023-06-01', '2024-11-30', 12000000.00, 'completed', 2, 1),
('PRJ-J1K2L3', 'Highway Bridge Repair', 'Structural repair and strengthening', 'NH-48, Km 234', 'NHAI', '2024-07-01', '2025-01-31', 8000000.00, 'active', 2, 1);
INSERT OR IGNORE INTO sites (site_code, name, location, address, project_id, engineer_id) VALUES
('SITE-M4N5O6', 'Greenfield Block A', 'Sector 45, Noida', 'Plot 12, Sector 45, Noida - 201301', 1, 3),
('SITE-P7Q8R9', 'Greenfield Block B', 'Sector 45, Noida', 'Plot 13, Sector 45, Noida - 201301', 1, 3),
('SITE-S1T2U3', 'City Mall Main Site', 'MG Road, Bangalore', 'Survey No. 234, MG Road, Bangalore - 560001', 2, 3),
('SITE-V4W5X6', 'Warehouse Site Pune', 'MIDC, Pune', 'MIDC Phase II, Bhosari, Pune - 411026', 3, 3),
('SITE-Y7Z8A9', 'NH48 Bridge Site', 'NH-48 Km 234', 'National Highway 48, Km 234, Gurugram', 4, 3);
INSERT OR IGNORE INTO materials (material_code, name, category_id, unit, description, cost_per_unit, minimum_threshold, reorder_quantity, supplier_id) VALUES
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