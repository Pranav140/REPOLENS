const path = require('path');

const STRIPPABLE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py'];

const ENTRY_FILENAMES = new Set([
  // JavaScript
  'index.js',
  'index.jsx',
  'main.js',
  'app.js',
  'server.js',
  'App.jsx',
  'App.js',
  // TypeScript
  'index.ts',
  'index.tsx',
  'main.ts',
  'app.ts',
  'server.ts',
  'App.tsx',
  'App.ts',
  // Python
  'main.py',
  'app.py',
  'server.py',
  '__main__.py',
]);

const TECH_STACK_KEYS = [
  'react',
  'next',
  'vue',
  'angular',
  'express',
  'fastify',
  'nestjs',
  'mongoose',
  'prisma',
  'typeorm',
  'sequelize',
  'jest',
  'vitest',
  'cypress',
  'mocha',
  'tailwindcss',
  'styled-components',
  'chakra-ui',
  'socket.io',
  'redis',
  'bull',
  'bullmq',
];

/**
 * Strip known source extensions from a resolved path.
 * @param {string} p
 */
function stripExtension(p) {
  const ext = path.posix.extname(p);
  return STRIPPABLE_EXTENSIONS.includes(ext) ? p.slice(0, -ext.length) : p;
}

/**
 * Extract all static import / require / dynamic-import paths from source content.
 * Only resolves relative paths (starting with . or ..) for JS, but for Python tries to resolve absolute module names.
 * @param {string} content
 * @param {string} filePath - absolute or repo-relative path of the file
 * @returns {string[]} Deduplicated resolved paths (extensions stripped)
 */
function extractImports(content, filePath) {
  const isPython = filePath.endsWith('.py');
  const dir = path.posix.dirname(filePath);
  const raw = new Set();

  if (isPython) {
    const importRe = /^\s*import\s+([a-zA-Z0-9_., ]+)/gm;
    const fromRe = /^\s*from\s+([a-zA-Z0-9_.]+)\s+import/gm;
    let match;
    
    while ((match = importRe.exec(content)) !== null) {
      const modules = match[1].split(',').map(s => s.trim());
      for (const mod of modules) {
        if (mod) {
          // Assume the module is in the same directory for a naive intra-repo check
          // e.g. import helper -> helper
          raw.add(path.posix.join(dir, mod));
        }
      }
    }
    
    while ((match = fromRe.exec(content)) !== null) {
      const mod = match[1];
      if (mod) {
        // e.g. from src.utils import x -> src/utils
        // This assumes root-level absolute import, which is common in Python
        raw.add(mod.replace(/\./g, '/'));
        
        // Also try relative to current dir in case it's a local import (naive fallback)
        raw.add(path.posix.join(dir, mod.replace(/\./g, '/')));
      }
    }
    return [...raw];
  }

  // JS/TS handling
  const patterns = [
    /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      let specifier = match[1];
      if (!specifier.startsWith('.')) continue; // skip bare module specifiers
      
      // Remove trailing index since import './utils' can mean './utils/index.js'
      if (specifier.endsWith('/')) specifier += 'index';
      
      let resolved = path.posix.join(dir, specifier);
      resolved = stripExtension(resolved);
      raw.add(resolved);
      
      // Also add '/index' variant because JS resolves folders to folder/index.js
      if (!resolved.endsWith('/index')) {
        raw.add(resolved + '/index');
      }
    }
  }

  return [...raw];
}

/**
 * Extract exported identifiers / module.exports from content.
 * @param {string} content
 * @returns {string[]}
 */
function extractExports(content) {
  const names = [];

  // named / default exports: export [default] const|function|class Name
  const namedRe = /export\s+(?:default\s+)?(?:const|function|class)\s+(\w+)/g;
  let match;
  while ((match = namedRe.exec(content)) !== null) {
    names.push(match[1]);
  }

  // export { foo, bar as baz }
  const braceRe = /export\s+\{([^}]+)\}/g;
  while ((match = braceRe.exec(content)) !== null) {
    const identifiers = match[1]
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/).pop().trim())
      .filter(Boolean);
    names.push(...identifiers);
  }

  // CommonJS module.exports
  if (/module\.exports/.test(content)) {
    names.push('module.exports');
  }

  return names;
}

/**
 * Extract function names using common declaration patterns.
 * @param {string} content
 * @returns {string[]}
 */
function extractFunctions(content) {
  const names = [];
  const patterns = [
    /function\s+(\w+)\s*\(/g,
    /const\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
    /const\s+(\w+)\s*=\s*(?:async\s*)?\w+\s*=>/g,
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      names.push(match[1]);
    }
  }

  return names;
}

/**
 * Extract class names.
 * @param {string} content
 * @returns {string[]}
 */
function extractClasses(content) {
  const names = [];
  const re = /class\s+(\w+)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
}

/**
 * Detect language from file extension.
 * @param {string} filePath
 * @returns {string}
 */
function detectLanguage(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.ts':
    case '.tsx':
      return 'TypeScript';
    case '.js':
    case '.jsx':
      return 'JavaScript';
    case '.py':
      return 'Python';
    case '.css':
    case '.scss':
      return 'CSS';
    case '.json':
      return 'JSON';
    case '.md':
      return 'Markdown';
    default:
      return 'Unknown';
  }
}

/**
 * Compute a heuristic complexity score for a file.
 * @param {string} content
 * @returns {number}
 */
function computeComplexity(content) {
  const lines = content.split('\n').length;
  const imports = (content.match(/import|require/g) || []).length;
  const fns = (content.match(/function |=> /g) || []).length;
  const classes = (content.match(/class /g) || []).length;
  const branches = (
    content.match(/\bif\b|\belse\b|\bfor\b|\bwhile\b|\bswitch\b/g) || []
  ).length;

  return Math.round(lines * 0.1 + imports * 2 + fns * 3 + classes * 4 + branches);
}

/**
 * Detect tech stack by inspecting package.json dependency keys.
 * @param {string[]} filePaths - unused, kept for API compatibility
 * @param {string|null} packageJsonContent - raw JSON string of package.json
 * @returns {string[]}
 */
function detectTechStack(filePaths, packageJsonContent) {
  if (!packageJsonContent) return [];

  let pkg;
  try {
    pkg = JSON.parse(packageJsonContent);
  } catch {
    return [];
  }

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const keys = Object.keys(allDeps);
  return TECH_STACK_KEYS.filter((tech) => keys.includes(tech));
}

/**
 * Returns true if the file is considered an entry point.
 * @param {string} filePath
 * @returns {boolean}
 */
function isEntryPoint(filePath) {
  const filename = path.basename(filePath);
  return ENTRY_FILENAMES.has(filename);
}

module.exports = {
  stripExtension,
  extractImports,
  extractExports,
  extractFunctions,
  extractClasses,
  detectLanguage,
  computeComplexity,
  detectTechStack,
  isEntryPoint,
};
