const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/material_inventory.db');
const db = new sqlite3.Database(dbPath);

const tables = [
  'users',
  'projects',
  'sites',
  'material_categories'
];

function queryTable(table) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM ${table}`;
    if (table === 'users') {
      sql = `SELECT id, name, email, role, phone, is_active FROM users`;
    }
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve({ table, rows });
    });
  });
}

async function run() {
  try {
    const results = [];
    for (const table of tables) {
      const result = await queryTable(table);
      results.push(result);
    }
    
    // Output as Markdown
    console.log('# Database First Tables Summary\n');
    for (const res of results) {
      console.log(`## Table: \`${res.table}\` (${res.rows.length} rows)`);
      if (res.rows.length === 0) {
        console.log('*No rows found.*\n');
        continue;
      }
      
      const headers = Object.keys(res.rows[0]);
      console.log('| ' + headers.join(' | ') + ' |');
      console.log('| ' + headers.map(() => '---').join(' | ') + ' |');
      for (const row of res.rows) {
        const values = headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') return val.replace(/\r?\n/g, ' ');
          return val;
        });
        console.log('| ' + values.join(' | ') + ' |');
      }
      console.log('\n');
    }
    db.close();
  } catch (err) {
    console.error('Error:', err.message);
    db.close();
  }
}

run();
