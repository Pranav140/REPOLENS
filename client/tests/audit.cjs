const fs = require('fs');
const path = require('path');

const issues = [];
let filesChecked = 0;

function getAllJSX(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && item !== 'node_modules' && item !== 'ui') {
      results.push(...getAllJSX(fullPath));
    } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const srcDir = path.join(__dirname, '../src');
const files = getAllJSX(srcDir);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const rel = path.relative(srcDir, file);
  filesChecked++;

  // CHECK 1 — useEffect with missing dependencies
  lines.forEach((line, i) => {
    if (line.includes('useEffect(') && !content.includes('eslint-disable')) {
      // Just flag files using useEffect for manual review
      // Don't auto-flag — too many false positives
    }
  });

  // CHECK 2 — console.log left in production code
  lines.forEach((line, i) => {
    if (line.includes('console.log') && !line.trim().startsWith('//')) {
      issues.push({
        file: rel,
        line: i + 1,
        severity: 'warn',
        message: 'console.log found — remove before demo',
      });
    }
  });

  // CHECK 3 — hardcoded localhost URLs
  lines.forEach((line, i) => {
    if (line.includes('localhost:5000') || line.includes('localhost:3000')) {
      issues.push({
        file: rel,
        line: i + 1,
        severity: 'error',
        message: `Hardcoded localhost URL found: "${line.trim()}" — use import.meta.env.VITE_API_URL`,
      });
    }
  });

  // CHECK 4 — missing error handling in async functions
  const asyncFunctions = content.match(/async\s+function\s+\w+|const\s+\w+\s*=\s*async/g) || [];
  const tryCatchCount = (content.match(/try\s*\{/g) || []).length;
  if (asyncFunctions.length > 0 && tryCatchCount === 0) {
    issues.push({
      file: rel,
      line: 1,
      severity: 'warn',
      message: `${asyncFunctions.length} async function(s) found but NO try/catch blocks — add error handling`,
    });
  }

  // CHECK 5 — useNavigate used outside Router context check
  if (content.includes('useNavigate') && !content.includes('BrowserRouter') && !file.includes('App.jsx')) {
    if (!content.includes("from 'react-router-dom'") && !content.includes('from "react-router-dom"')) {
      issues.push({
        file: rel,
        line: 1,
        severity: 'error',
        message: 'useNavigate used but react-router-dom not imported',
      });
    }
  }

  // CHECK 6 — api.js import consistency
  if (content.includes('axios.get') || content.includes('axios.post')) {
    if (
      !content.includes("from '../api/api'") &&
      !content.includes("from '../../api/api'") &&
      !content.includes("from '../../../api/api'") &&
      !file.includes('api.js')
    ) {
      issues.push({
        file: rel,
        line: 1,
        severity: 'error',
        message: 'Direct axios usage found — import api instance from api/api.js instead',
      });
    }
  }

  // CHECK 7 — missing loading state in data-fetching pages
  const hasUseEffect = content.includes('useEffect');
  const hasApiCall = content.includes('api.get') || content.includes('api.post');
  const hasLoadingState = content.includes('isLoading') || content.includes('loading');
  const hasSkeleton = content.includes('Skeleton') || content.includes('skeleton');

  if (hasUseEffect && hasApiCall && !hasLoadingState) {
    issues.push({
      file: rel,
      line: 1,
      severity: 'warn',
      message: 'Page fetches data but has no loading state — add isLoading',
    });
  }

  // CHECK 8 — missing error state
  if (hasUseEffect && hasApiCall && !content.includes('error') && !content.includes('Error')) {
    issues.push({
      file: rel,
      line: 1,
      severity: 'warn',
      message: 'Page fetches data but has no error handling state',
    });
  }

  // CHECK 9 — VITE env variable usage
  if (content.includes('process.env.') && !file.includes('vite.config')) {
    issues.push({
      file: rel,
      line: 1,
      severity: 'error',
      message: 'process.env used in React — use import.meta.env instead',
    });
  }

  // CHECK 10 — Props passed but not destructured
  if (content.includes('props.') && content.includes('function') && !content.includes('...props')) {
    issues.push({
      file: rel,
      line: 1,
      severity: 'warn',
      message: 'props.x pattern found — consider destructuring props',
    });
  }

  // CHECK 11 — Empty catch blocks
  const emptyCatch = content.match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
  if (emptyCatch) {
    issues.push({
      file: rel,
      line: 1,
      severity: 'error',
      message: `${emptyCatch.length} empty catch block(s) found — errors are being silently swallowed`,
    });
  }

  // CHECK 12 — Token read outside useAuth
  lines.forEach((line, i) => {
    if (
      line.includes("localStorage.getItem('repolens_token')") &&
      !file.includes('useAuth') &&
      !file.includes('api.js') &&
      !file.includes('AuthCallback')
    ) {
      issues.push({
        file: rel,
        line: i + 1,
        severity: 'warn',
        message: 'Direct localStorage token read — use useAuth() hook instead',
      });
    }
  });
}

const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'warn');

console.log(`\n--- FRONTEND AUDIT RESULTS ---`);
console.log(`Files checked: ${filesChecked}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n🔴 ERRORS (must fix):');
  errors.forEach((i) => {
    console.log(`  ${i.file}:${i.line} — ${i.message}`);
  });
}

if (warnings.length > 0) {
  console.log('\n🟡 WARNINGS (should fix):');
  warnings.forEach((i) => {
    console.log(`  ${i.file}:${i.line} — ${i.message}`);
  });
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ No issues found');
}

if (errors.length > 0) process.exit(1);
