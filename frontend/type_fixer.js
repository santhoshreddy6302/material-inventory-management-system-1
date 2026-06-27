import * as fs from 'fs';
import * as path from 'path';

const servicesDir = 'c:/Users/santh/OneDrive/Desktop/material-inventory-final/frontend/src/services';

const files = fs.readdirSync(servicesDir);

for (const file of files) {
  if (file === 'api.ts') continue;
  if (!file.endsWith('.ts')) continue;

  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex replacements
  content = content.replace(/\bp =>/g, '(p?: Record<string, any>) =>');
  content = content.replace(/\bid =>/g, '(id: string) =>');
  content = content.replace(/\bd =>/g, '(d: Record<string, any>) =>');
  content = content.replace(/\(id, d\) =>/g, '(id: string, d: Record<string, any>) =>');
  content = content.replace(/\bids =>/g, '(ids: string[]) =>');
  
  // Custom for dashboardService
  content = content.replace(/\(start, end\) =>/g, '(start: string, end: string) =>');
  
  fs.writeFileSync(filePath, content);
}
console.log('Services updated');
