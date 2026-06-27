const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('🌱 Running database seed...');

  try {
    // Create database
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'material_inventory'}`);
    await conn.query(`USE ${process.env.DB_NAME || 'material_inventory'}`);

    // Read and run SQL schema
    const sqlFile = path.join(__dirname, '../../database/material_inventory.sql');
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf8');
      await conn.query(sql);
      console.log('✅ Schema applied successfully');
    }

    // Verify admin user
    const [users] = await conn.query("SELECT COUNT(*) as c FROM users");
    console.log(`✅ Users seeded: ${users[0].c}`);

    const [projects] = await conn.query("SELECT COUNT(*) as c FROM projects");
    console.log(`✅ Projects seeded: ${projects[0].c}`);

    const [materials] = await conn.query("SELECT COUNT(*) as c FROM materials");
    console.log(`✅ Materials seeded: ${materials[0].c}`);

    // Add inventory records for seeded sites and materials
    await conn.query(`
      INSERT IGNORE INTO inventory (material_id, site_id, current_stock) VALUES
      (1, 1, 1200), (2, 1, 25.5), (3, 1, 150), (4, 1, 45), (5, 1, 30),
      (6, 1, 800), (7, 1, 1500), (8, 1, 3000), (9, 1, 4500), (10, 1, 80),
      (1, 2, 800), (2, 2, 18), (3, 2, 80), (4, 2, 12), (5, 2, 8),
      (1, 3, 600), (2, 3, 30), (3, 3, 200), (4, 3, 25), (7, 3, 800),
      (1, 4, 2000), (2, 4, 45), (3, 4, 300), (8, 4, 5000), (9, 4, 8000)
    `);
    console.log('✅ Inventory records added');

    // Sample usage records
    await conn.query(`
      INSERT IGNORE INTO material_usage (usage_code, site_id, material_id, quantity_used, unit_cost, total_cost, usage_date, purpose, recorded_by) VALUES
      ('USE-001001', 1, 1, 120, 380, 45600, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Foundation concrete mix', 3),
      ('USE-001002', 1, 2, 3.5, 62000, 217000, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Column reinforcement', 3),
      ('USE-001003', 1, 3, 25, 7500, 187500, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Brick masonry wall', 3),
      ('USE-001004', 2, 1, 80, 380, 30400, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'Slab casting', 3),
      ('USE-001005', 3, 7, 200, 120, 24000, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Plumbing installation', 3)
    `);

    // Sample wastage
    await conn.query(`
      INSERT IGNORE INTO wastage_records (wastage_code, site_id, material_id, quantity_wasted, unit_cost, total_cost, wastage_date, reason, preventable, recorded_by) VALUES
      ('WST-001001', 1, 1, 15, 380, 5700, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'spill', 1, 3),
      ('WST-001002', 1, 3, 5, 7500, 37500, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'damage', 0, 3),
      ('WST-001003', 2, 4, 2, 1800, 3600, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'cutting_loss', 0, 3)
    `);

    // Activity logs
    await conn.query(`
      INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_name) VALUES
      (1, 'System Admin', 'System initialized', 'system', 'Material Inventory System'),
      (2, 'Raj Kumar', 'Created project', 'project', 'Greenfield Residential Complex'),
      (3, 'Amit Singh', 'Recorded material usage', 'material_usage', 'OPC 53 Grade Cement')
    `);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Admin:       admin@constco.com / Admin@123');
    console.log('   PM:          pm@constco.com / Admin@123');
    console.log('   Engineer:    engineer@constco.com / Admin@123');
    console.log('   Procurement: procurement@constco.com / Admin@123');
    console.log('   Accounts:    accounts@constco.com / Admin@123');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await conn.end();
  }
}

seed();
