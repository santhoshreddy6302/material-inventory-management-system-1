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

const files = walk(path.resolve(__dirname));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('string.')) {
    content = content.replace(/string\.(\w+)/g, '"$1"');
    fs.writeFileSync(f, content);
    console.log('Fixed string.', f);
  }
});
