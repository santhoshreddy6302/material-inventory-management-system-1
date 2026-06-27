const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/src/services');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf-8');
  // replace `id: string` with `id: string | number`
  content = content.replace(/id: string/g, 'id: string | number');
  fs.writeFileSync(p, content);
  console.log(`Updated ${f}`);
});
