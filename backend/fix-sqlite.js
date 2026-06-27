const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') && !file.includes('node_modules')) {
      results.push(file);
    }
  });
  return results;
}

const enums = [
  'Role', 'ProjectStatus', 'TransactionType', 'PoStatus', 'PaymentStatus', 
  'WastageReason', 'TransferStatus', 'AlertType', 'Severity', 'EnquiryStatus', 
  'MilestoneStatus', 'SubcontractorTaskStatus', 'EquipmentStatus'
];

const files = walk(path.resolve(__dirname));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Remove mode: 'insensitive'
  if (content.includes("mode: 'insensitive'")) {
    content = content.replace(/,\s*mode:\s*'insensitive'/g, '');
    content = content.replace(/mode:\s*'insensitive'\s*,?/g, '');
    changed = true;
  }

  // Remove enum types from @prisma/client imports
  enums.forEach(e => {
    const importRegex = new RegExp(`\\b${e}\\b\\s*,?`, 'g');
    if (content.includes('@prisma/client') && content.includes(e)) {
      // Very naive: just replace the exact word in the file if it's imported from prisma
      // A better way is to replace `role: Role` with `role: string`
      const typeRegex = new RegExp(`:\\s*${e}\\b`, 'g');
      content = content.replace(typeRegex, ': string');
      
      const asRegex = new RegExp(`as\\s+${e}\\b`, 'g');
      content = content.replace(asRegex, 'as string');

      // Remove from import
      content = content.replace(importRegex, '');
      changed = true;
    }
  });

  // Clean up empty imports like `import {  } from '@prisma/client'`
  content = content.replace(/import\s*\{\s*\}\s*from\s*['"]@prisma\/client['"];?/g, '');

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
});
