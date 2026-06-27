const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const sqlPath = path.join(__dirname, '../../database/material_inventory.sql');
const dbPath = path.join(__dirname, '../../database/material_inventory.db');

console.log('📁 Database SQL Path:', sqlPath);
console.log('📁 SQLite DB Path:', dbPath);

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Delete existing db file if any to start fresh
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('🗑️ Deleted existing SQLite file');
  } catch (err) {
    console.error('⚠️ Could not delete existing SQLite file:', err.message);
  }
}

const db = new sqlite3.Database(dbPath);

function splitByCommasOutsideParentheses(str) {
  const parts = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let quoteChar = null;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    // Handle quotes to avoid matching inside strings
    if ((char === "'" || char === '"') && (i === 0 || str[i-1] !== '\\')) {
      if (!inString) {
        inString = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inString = false;
        quoteChar = null;
      }
    }

    if (!inString) {
      if (char === '(') depth++;
      else if (char === ')') depth--;
    }
    
    if (char === ',' && depth === 0 && !inString) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function translateSchema(sql) {
  let lines = sql.split('\n');
  lines = lines.filter(line => !line.trim().startsWith('--') && line.trim() !== '');
  
  let content = lines.join('\n');
  
  // Remove MySQL specific headers
  content = content.replace(/\bCREATE DATABASE\s+[^;]+;/gi, '');
  content = content.replace(/\bUSE\s+\w+\s*;/gi, '');
  content = content.replace(/\bSET FOREIGN_KEY_CHECKS\s*=\s*\d\s*;/gi, '');
  
  // Extract and parse CREATE TABLE blocks
  const createTableRegex = /CREATE TABLE\s+(\w+)\s*\(([\s\S]+?)\)\s*;/gi;
  let match;
  let newSqlStatements = [];
  const processedTables = new Set();
  
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const tableBody = match[2];
    processedTables.add(tableName.toLowerCase());
    
    const bodyLines = splitByCommasOutsideParentheses(tableBody);
    const newBodyLines = [];
    const indexStatements = [];
    
    for (let line of bodyLines) {
      line = line.trim();
      if (!line) continue;
      
      // Inline index definitions (remove and create separate index statement)
      const indexMatch = /^(?:INDEX|KEY)\s+(\w+)\s*\(([^)]+)\)/i.exec(line);
      if (indexMatch) {
        const indexName = indexMatch[1];
        const indexCols = indexMatch[2];
        indexStatements.push(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${indexCols});`);
        continue;
      }
      
      // UNIQUE KEY definition
      const uniqueMatch = /^UNIQUE\s+(?:KEY\s+)?(\w+)?\s*\(([^)]+)\)/i.exec(line);
      if (uniqueMatch) {
        const cols = uniqueMatch[2];
        newBodyLines.push(`UNIQUE (${cols})`);
        continue;
      }
      
      // AUTO_INCREMENT PRIMARY KEY translation
      if (/AUTO_INCREMENT/i.test(line)) {
        line = line.replace(/\w+\s+(?:UNSIGNED\s+)?PRIMARY\s+KEY\s+AUTO_INCREMENT/i, 'INTEGER PRIMARY KEY AUTOINCREMENT');
      }
      
      // Data type conversions
      line = line.replace(/\bINT UNSIGNED\b/gi, 'INTEGER');
      line = line.replace(/\bINT\b/gi, 'INTEGER');
      line = line.replace(/\bTINYINT\s*\(\d+\)/gi, 'INTEGER');
      line = line.replace(/\bTINYINT\b/gi, 'INTEGER');
      line = line.replace(/\bDECIMAL\s*\([^)]+\)/gi, 'REAL');
      line = line.replace(/\bDECIMAL\b/gi, 'REAL');
      line = line.replace(/\bENUM\s*\([^)]+\)/gi, 'TEXT');
      line = line.replace(/\bDATETIME\b/gi, 'TEXT');
      line = line.replace(/\bTIMESTAMP\b/gi, 'TEXT');
      
      // Remove ON UPDATE CURRENT_TIMESTAMP
      line = line.replace(/\bON UPDATE CURRENT_TIMESTAMP\b/gi, '');
      
      newBodyLines.push(line);
    }
    
    // Add custom UNIQUE constraint for alerts table to support ON CONFLICT
    if (tableName.toLowerCase() === 'alerts') {
      newBodyLines.push('UNIQUE(type, material_id, site_id)');
    }
    
    const newTableSql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${newBodyLines.join(',\n  ')}\n);`;
    newSqlStatements.push(newTableSql);
    newSqlStatements.push(...indexStatements);
  }
  
  // Extract DROP TABLE statements
  const dropTableStatements = [];
  const dropMatch = /DROP TABLE IF EXISTS (\w+);/gi;
  let d;
  while ((d = dropMatch.exec(content)) !== null) {
    dropTableStatements.push(`DROP TABLE IF EXISTS ${d[1]};`);
  }
  
  // Build clean SQL script
  const sqlScriptLines = [
    'PRAGMA foreign_keys = OFF;',
    ...dropTableStatements,
    'PRAGMA foreign_keys = ON;',
    ...newSqlStatements
  ];
  
  // Extract and translate INSERT statements
  const matches = content.match(/INSERT\s+INTO[\s\S]+?;/gi) || [];
  for (let matchStr of matches) {
    let stmt = matchStr.trim();
    stmt = stmt.replace(/^INSERT INTO/i, 'INSERT OR IGNORE INTO');
    sqlScriptLines.push(stmt);
  }
  
  return sqlScriptLines.join('\n');
}

// Load and translate schema
try {
  const schemaSql = fs.readFileSync(sqlPath, 'utf8');
  console.log('✅ Loaded schema file');
  
  const translatedSql = translateSchema(schemaSql);
  console.log('✅ Translated MySQL schema to SQLite');
  
  // Write debug file
  const debugPath = path.join(__dirname, 'translated_schema.sql');
  fs.writeFileSync(debugPath, translatedSql);
  console.log('📝 Saved translated schema to translated_schema.sql for debugging');
  
  // Run schema execution
  db.serialize(() => {
    // We run statements one by one or via exec.
    // In sqlite3, exec executes all statements.
    db.exec(translatedSql, (err) => {
      if (err) {
        console.error('❌ Error executing translated SQLite schema:', err.message);
        process.exit(1);
      }
      console.log('✅ Database schema and seed data loaded successfully!');
      
      // Run the JS-based seeding for inventory and transactions
      runJsSeeding();
    });
  });
} catch (err) {
  console.error('❌ Initialization failed:', err.message);
  process.exit(1);
}

function runJsSeeding() {
  console.log('🌱 Seeding sample transactional data...');
  
  db.serialize(() => {
    // 1. Seed inventory records
    const inventoryData = [
      [1, 1, 1200], [2, 1, 25.5], [3, 1, 150], [4, 1, 45], [5, 1, 30],
      [6, 1, 800], [7, 1, 1500], [8, 1, 3000], [9, 1, 4500], [10, 1, 80],
      [1, 2, 800], [2, 2, 18], [3, 2, 80], [4, 2, 12], [5, 2, 8],
      [1, 3, 600], [2, 3, 30], [3, 3, 200], [4, 3, 25], [7, 3, 800],
      [1, 4, 2000], [2, 4, 45], [3, 4, 300], [8, 4, 5000], [9, 4, 8000]
    ];
    
    const invStmt = db.prepare('INSERT OR IGNORE INTO inventory (material_id, site_id, current_stock) VALUES (?, ?, ?)');
    for (const row of inventoryData) {
      invStmt.run(row);
    }
    invStmt.finalize();
    console.log('   - Inventory records added');

    // Helper to get formatted dates
    const getPastDate = (daysAgo) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    // 2. Seed material usage
    const usageData = [
      ['USE-001001', 1, 1, 120, 380, 45600, getPastDate(5), 'Foundation concrete mix', 3],
      ['USE-001002', 1, 2, 3.5, 62000, 217000, getPastDate(4), 'Column reinforcement', 3],
      ['USE-001003', 1, 3, 25, 7500, 187500, getPastDate(3), 'Brick masonry wall', 3],
      ['USE-001004', 2, 1, 80, 380, 30400, getPastDate(6), 'Slab casting', 3],
      ['USE-001005', 3, 7, 200, 120, 24000, getPastDate(2), 'Plumbing installation', 3]
    ];
    
    const usageStmt = db.prepare(`
      INSERT OR IGNORE INTO material_usage 
      (usage_code, site_id, material_id, quantity_used, unit_cost, total_cost, usage_date, purpose, recorded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const row of usageData) {
      usageStmt.run(row);
    }
    usageStmt.finalize();
    console.log('   - Material usage records added');

    // 3. Seed wastage records
    const wastageData = [
      ['WST-001001', 1, 1, 15, 380, 5700, getPastDate(7), 'spill', 1, 3],
      ['WST-001002', 1, 3, 5, 7500, 37500, getPastDate(6), 'damage', 0, 3],
      ['WST-001003', 2, 4, 2, 1800, 3600, getPastDate(3), 'cutting_loss', 0, 3]
    ];
    
    const wastageStmt = db.prepare(`
      INSERT OR IGNORE INTO wastage_records 
      (wastage_code, site_id, material_id, quantity_wasted, unit_cost, total_cost, wastage_date, reason, preventable, recorded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const row of wastageData) {
      wastageStmt.run(row);
    }
    wastageStmt.finalize();
    console.log('   - Wastage records added');

    // 4. Seed activity logs
    const activityData = [
      [1, 'System Admin', 'System initialized', 'system', 'Material Inventory System'],
      [2, 'Raj Kumar', 'Created project', 'project', 'Greenfield Residential Complex'],
      [3, 'Amit Singh', 'Recorded material usage', 'material_usage', 'OPC 53 Grade Cement']
    ];
    
    const activityStmt = db.prepare(`
      INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_name) 
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const row of activityData) {
      activityStmt.run(row);
    }
    activityStmt.finalize();
    console.log('   - Activity logs added');

    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database during setup:', err.message);
        process.exit(1);
      }
      console.log('\n✅ SQLite Database completely set up and seeded!');
    });
  });
}
