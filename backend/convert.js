const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Change Provider
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');

// 2. Remove Enums
const enums = [
  'Role', 'ProjectStatus', 'TransactionType', 'PoStatus', 'PaymentStatus', 
  'WastageReason', 'TransferStatus', 'AlertType', 'Severity', 'EnquiryStatus', 
  'MilestoneStatus', 'SubcontractorTaskStatus', 'EquipmentStatus'
];

enums.forEach(e => {
  const regex = new RegExp(`enum ${e} \\{[^\\}]+\\}`, 'g');
  schema = schema.replace(regex, '');
});

// 3. Replace Enum Fields
enums.forEach(e => {
  const regex = new RegExp(`(\\w+)\\s+${e}(\\?)?`, 'g');
  schema = schema.replace(regex, `$1 String$2`);
});

// 4. Fix Defaults for Enums (needs quotes)
// e.g. @default(planning) -> @default("planning")
const defaultsToQuote = [
  'site_engineer', 'planning', 'draft', 'pending', 'active', 'new', 'medium'
];
defaultsToQuote.forEach(d => {
  const regex = new RegExp(`@default\\(${d}\\)`, 'g');
  schema = schema.replace(regex, `@default("${d}")`);
});

// 5. Remove @db.* annotations
schema = schema.replace(/@db\.VarChar\(\d+\)/g, '');
schema = schema.replace(/@db\.Text/g, '');
schema = schema.replace(/@db\.Date/g, '');
schema = schema.replace(/@db\.Decimal\(\d+,\s*\d+\)/g, '');

// 6. Replace Json with String
schema = schema.replace(/Json\?/g, 'String?');
schema = schema.replace(/Json/g, 'String');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Successfully converted schema.prisma to SQLite format');
