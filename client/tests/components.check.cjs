const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/components');
let filesChecked = 0;
let errors = 0;

function getAllJSX(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...getAllJSX(fullPath));
    } else if (item.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getAllJSX(srcDir);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(srcDir, file);
  filesChecked++;

  let hasExportDefault = false;
  let componentName = path.basename(file, '.jsx');
  
  if (content.includes(`export default ${componentName}`) || content.includes('export default function')) {
    hasExportDefault = true;
  }

  // Allow index.js or UI library components to skip the exact name match
  if (!hasExportDefault && !file.includes('ui')) {
    console.log(`❌ ERROR: ${rel} is missing a default export matching its filename`);
    errors++;
  }

  if (content.includes('className=') && !content.includes('lucide-react')) {
    // Basic check for styling consistency (e.g. standard classes vs utility)
    // We won't strictly fail this, just log it if we were doing a deep tailwind check
  }
}

console.log(`\n--- COMPONENT SHAPE RESULTS ---`);
console.log(`Checked: ${filesChecked}`);
console.log(`Errors: ${errors}`);
if (errors > 0) process.exit(1);
