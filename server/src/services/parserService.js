const path = require('path');

const STRIPPABLE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

const ENTRY_FILENAMES = [
  'index.js',
  'index.jsx',
  'main.js',
  'app.js',
  'server.js',
  'App.jsx',
  'App.js',
];

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
  const ext = path.extname(p);
  return STRIPPABLE_EXTENSIONS.includes(ext) ? p.slice(0, -ext.length) : p;
}

/**
 * Extract all static import / require / dynamic-import paths from source content.
 * Only resolves relative paths (starting with . or ..).
 * @param {string} content
 * @param {string} filePath - absolute or repo-relative path of the file
 * @returns {string[]} Deduplicated resolved paths (extensions stripped)
 */
function extractImports(content, filePath) {
  const patterns = [
    /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  const raw = new Set();

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const specifier = match[1];
      if (!specifier.startsWith('.')) continue; // skip bare module specifiers
      const resolved = stripExtension(
        path.resolve(path.dirname(filePath), specifier)
      );
      raw.add(resolved);
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
  return ENTRY_FILENAMES.includes(filename);
}

module.exports = {
  extractImports,
  extractExports,
  extractFunctions,
  extractClasses,
  detectLanguage,
  computeComplexity,
  detectTechStack,
  isEntryPoint,
};
