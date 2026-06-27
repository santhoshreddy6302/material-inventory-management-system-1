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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.resolve(__dirname, './src'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  // Calculate relative path from this file's directory to the src directory
  const relPath = path.relative(path.dirname(f), path.resolve(__dirname, './src')).replace(/\\/g, '/');
  const prefix = relPath === '' ? './' : relPath + '/';
  
  const newContent = content.replace(/from\s+['"]@\/(.*?)['"]/g, (match, p1) => {
    changed = true;
    return `from '${prefix}${p1}'`;
  });
  
  if (changed) {
    fs.writeFileSync(f, newContent);
    console.log('Fixed', f);
  }
});
