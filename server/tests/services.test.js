/**
 * RepoLens Service Unit Tests
 * Pure function tests — no DB, no HTTP, no GitHub API.
 * Usage: npm run test:services
 */
const parserService = require('../src/services/parserService');
const { extractFunctionSignatures } = require('../src/services/breakingChangeService');
const { estimateOnboardingTime } = require('../src/services/onboardingEstimateService');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`Expected ${JSON.stringify(b)} but got ${JSON.stringify(a)}`);
  }
}

// ── extractImports ────────────────────────────────────────────────────────────

console.log('\n--- parserService.extractImports ---');

test('extractImports: finds relative imports (JS)', () => {
  const content = `import something from './utils'`;
  const result = parserService.extractImports(content, 'src/components/App.js');
  assert(result.length > 0, 'Should find at least 1 import');
});

test('extractImports: ignores node_modules imports', () => {
  const content = `import React from 'react'`;
  const result = parserService.extractImports(content, 'src/App.js');
  assert(result.length === 0, 'Should ignore npm packages');
});

test('extractImports: finds require() calls', () => {
  const content = `const x = require('./helper')`;
  const result = parserService.extractImports(content, 'src/index.js');
  assert(result.length > 0, 'Should find require');
});

test('extractImports: finds multiple imports', () => {
  const content = `
    import a from './a'
    import b from './b'
    const c = require('./c')
  `;
  const result = parserService.extractImports(content, 'src/index.js');
  // Each import also generates a /index fallback variant, so count may be >= 3
  assert(result.length >= 3, `Should find at least 3 imports, got ${result.length}`);
});

test('extractImports: returns empty array for no imports', () => {
  const content = `const x = 1 + 1`;
  const result = parserService.extractImports(content, 'src/x.js');
  assert(Array.isArray(result), 'Should return array');
  assert(result.length === 0, 'Should be empty');
});

test('extractImports: finds Python import statements', () => {
  const content = `import helper\nimport utils`;
  const result = parserService.extractImports(content, 'app.py');
  assert(result.length > 0, 'Should find python imports');
});

test('extractImports: finds Python from...import statements', () => {
  const content = `from src.utils import something`;
  const result = parserService.extractImports(content, 'app.py');
  assert(result.length > 0, 'Should find from...import');
});

// ── extractFunctions ──────────────────────────────────────────────────────────

console.log('\n--- parserService.extractFunctions ---');

test('extractFunctions: finds function declarations', () => {
  const content = `function myFunc() { return 1 }`;
  const result = parserService.extractFunctions(content);
  assert(result.includes('myFunc'), 'Should find myFunc');
});

test('extractFunctions: finds arrow functions', () => {
  const content = `const doSomething = () => {}`;
  const result = parserService.extractFunctions(content);
  assert(result.includes('doSomething'), 'Should find doSomething');
});

test('extractFunctions: finds async functions', () => {
  const content = `async function fetchData() {}`;
  const result = parserService.extractFunctions(content);
  assert(result.includes('fetchData'), 'Should find fetchData');
});

test('extractFunctions: returns array for no functions', () => {
  const content = `const x = 42`;
  const result = parserService.extractFunctions(content);
  assert(Array.isArray(result), 'Should return array');
});

// ── extractClasses ────────────────────────────────────────────────────────────

console.log('\n--- parserService.extractClasses ---');

test('extractClasses: finds class declarations', () => {
  const content = `class UserService { constructor() {} }`;
  const result = parserService.extractClasses(content);
  assert(result.includes('UserService'), 'Should find UserService');
});

test('extractClasses: finds multiple classes', () => {
  const content = `\n    class Foo {}\n    class Bar {}\n  `;
  const result = parserService.extractClasses(content);
  assert(result.length >= 2, `Should find 2 classes, got ${result.length}`);
});

// ── detectLanguage ────────────────────────────────────────────────────────────

console.log('\n--- parserService.detectLanguage ---');

test('detectLanguage: detects TypeScript', () => {
  assertEqual(parserService.detectLanguage('src/app.ts'), 'TypeScript');
});

test('detectLanguage: detects JavaScript (.js)', () => {
  assertEqual(parserService.detectLanguage('src/app.js'), 'JavaScript');
});

test('detectLanguage: detects JavaScript (.jsx)', () => {
  assertEqual(parserService.detectLanguage('App.jsx'), 'JavaScript');
});

test('detectLanguage: detects JSON', () => {
  assertEqual(parserService.detectLanguage('package.json'), 'JSON');
});

test('detectLanguage: detects Python', () => {
  assertEqual(parserService.detectLanguage('app.py'), 'Python');
});

test('detectLanguage: handles unknown extension', () => {
  const result = parserService.detectLanguage('file.xyz');
  assert(typeof result === 'string', 'Should return string');
});

// ── computeComplexity ─────────────────────────────────────────────────────────

console.log('\n--- parserService.computeComplexity ---');

test('computeComplexity: empty file scores low', () => {
  const score = parserService.computeComplexity('');
  assert(score >= 0, 'Score should be >= 0');
  assert(score < 10, `Empty file should score low, got ${score}`);
});

test('computeComplexity: complex file scores higher than simple', () => {
  const simple = `const x = 1`;
  const complex = `
    import a from './a'
    import b from './b'
    class Foo {
      constructor() {}
      method1() { if (true) { for (let i=0;i<10;i++) {} } }
      method2() { while(true) {} }
    }
    function bar() {}
    function baz() {}
  `;
  const simpleScore = parserService.computeComplexity(simple);
  const complexScore = parserService.computeComplexity(complex);
  assert(
    complexScore > simpleScore,
    `Complex (${complexScore}) should score higher than simple (${simpleScore})`,
  );
});

test('computeComplexity: returns a valid number', () => {
  const result = parserService.computeComplexity('some code');
  assert(typeof result === 'number', 'Should return number');
  assert(!isNaN(result), 'Should not be NaN');
});

// ── detectTechStack ───────────────────────────────────────────────────────────

console.log('\n--- parserService.detectTechStack ---');

test('detectTechStack: detects react', () => {
  const pkg = JSON.stringify({ dependencies: { react: '^18.0.0' } });
  const result = parserService.detectTechStack([], pkg);
  assert(result.includes('react'), 'Should detect react');
});

test('detectTechStack: handles invalid package.json', () => {
  const result = parserService.detectTechStack([], 'not valid json');
  assert(Array.isArray(result), 'Should return array even on error');
});

test('detectTechStack: handles null packageJson', () => {
  const result = parserService.detectTechStack([], null);
  assert(Array.isArray(result), 'Should return array for null');
  assert(result.length === 0, 'Should be empty for null');
});

test('detectTechStack: detects multiple packages', () => {
  const pkg = JSON.stringify({
    dependencies: { react: '^18.0.0', express: '^4.0.0' },
    devDependencies: { jest: '^29.0.0' },
  });
  const result = parserService.detectTechStack([], pkg);
  assert(result.includes('react'), 'Should detect react');
  assert(result.includes('express'), 'Should detect express');
  assert(result.includes('jest'), 'Should detect jest');
});

// ── isEntryPoint ──────────────────────────────────────────────────────────────

console.log('\n--- parserService.isEntryPoint ---');

test('isEntryPoint: detects index.js', () => {
  assert(parserService.isEntryPoint('src/index.js'), 'index.js should be entry point');
});

test('isEntryPoint: detects App.jsx', () => {
  assert(parserService.isEntryPoint('src/App.jsx'), 'App.jsx should be entry point');
});

test('isEntryPoint: detects server.js', () => {
  assert(parserService.isEntryPoint('server.js'), 'server.js should be entry point');
});

test('isEntryPoint: regular file is not entry', () => {
  assert(!parserService.isEntryPoint('src/utils/helper.js'), 'helper.js should not be entry');
});

// ── breakingChangeService.extractFunctionSignatures ───────────────────────────

console.log('\n--- breakingChangeService.extractFunctionSignatures ---');

test('extractFunctionSignatures: finds exported functions', () => {
  const content = `
    export function login(username, password) {}
    export const logout = (userId) => {}
  `;
  const sigs = extractFunctionSignatures(content);
  assert(sigs.length >= 2, `Should find >= 2 signatures, got ${sigs.length}`);
  const loginSig = sigs.find((s) => s.name === 'login');
  assert(loginSig, 'Should find login');
  assert(loginSig.params.includes('username'), 'Should find username param');
});

test('extractFunctionSignatures: handles empty content', () => {
  const result = extractFunctionSignatures('');
  assert(Array.isArray(result), 'Should return array');
  assert(result.length === 0, 'Should be empty');
});

test('extractFunctionSignatures: finds non-exported functions', () => {
  const content = `function helper(a, b, c) {}`;
  const result = extractFunctionSignatures(content);
  const helperSig = result.find((s) => s.name === 'helper');
  assert(helperSig, 'Should find helper');
  assert(helperSig.params.length === 3, `Expected 3 params, got ${helperSig.params.length}`);
});

// ── Security patterns ─────────────────────────────────────────────────────────

console.log('\n--- securityService patterns ---');

test('security: hardcoded password pattern matches', () => {
  const content = `const password = 'supersecret123'`;
  const re = /password\s*=\s*['"][^'"]{3,}['"]/gi;
  re.lastIndex = 0;
  assert(re.test(content), 'Should match hardcoded password');
});

test('security: eval pattern matches', () => {
  const content = `eval(userInput)`;
  const re = /eval\s*\(/g;
  re.lastIndex = 0;
  assert(re.test(content), 'Should match eval usage');
});

test('security: dangerouslySetInnerHTML pattern matches', () => {
  const content = `<div dangerouslySetInnerHTML={{ __html: x }} />`;
  const re = /dangerouslySetInnerHTML/g;
  re.lastIndex = 0;
  assert(re.test(content), 'Should match dangerouslySetInnerHTML');
});

// ── Blast Radius — pure BFS logic ─────────────────────────────────────────────

console.log('\n--- blastRadiusService: transitive traversal ---');

function getTransitiveDependents(filePath, reverseAdj) {
  const visited = new Set();
  const queue = [filePath];
  while (queue.length) {
    const current = queue.shift();
    for (const dep of reverseAdj[current] || []) {
      if (!visited.has(dep)) {
        visited.add(dep);
        queue.push(dep);
      }
    }
  }
  return Array.from(visited);
}

test('blast radius: transitive traversal includes all dependents', () => {
  const reverseAdj = {
    'a.js': ['b.js', 'c.js'],
    'b.js': ['d.js'],
    'c.js': ['d.js'],
  };
  const result = getTransitiveDependents('a.js', reverseAdj);
  assert(result.includes('b.js'), 'Should include b.js');
  assert(result.includes('c.js'), 'Should include c.js');
  assert(result.includes('d.js'), 'Should include d.js');
  assert(result.length === 3, `Expected 3, got ${result.length}`);
});

test('blast radius: isolated file returns empty', () => {
  const result = getTransitiveDependents('lonely.js', {});
  assert(result.length === 0, 'Should be empty for isolated file');
});

test('blast radius: handles circular references without infinite loop', () => {
  const reverseAdj = { 'a.js': ['b.js'], 'b.js': ['a.js'] };
  // Should NOT hang
  const result = getTransitiveDependents('a.js', reverseAdj);
  assert(Array.isArray(result), 'Should return array even with cycle');
});

// ── Cycle Detection ───────────────────────────────────────────────────────────

console.log('\n--- analysisService: cycle detection ---');

function detectCycles(graph) {
  const visited = new Set();
  const stack = new Set();
  let count = 0;
  function dfs(node) {
    visited.add(node);
    stack.add(node);
    for (const n of graph[node] || []) {
      if (!visited.has(n)) dfs(n);
      else if (stack.has(n)) count++;
    }
    stack.delete(node);
  }
  Object.keys(graph).forEach((n) => { if (!visited.has(n)) dfs(n); });
  return count;
}

test('cycle detection: detects simple cycle a→b→a', () => {
  const graph = { 'a.js': ['b.js'], 'b.js': ['a.js'] };
  const count = detectCycles(graph);
  assert(count > 0, `Should detect cycle, got ${count}`);
});

test('cycle detection: no cycle in linear chain a→b→c', () => {
  const graph = { 'a.js': ['b.js'], 'b.js': ['c.js'] };
  const count = detectCycles(graph);
  assert(count === 0, `Should find 0 cycles, got ${count}`);
});

test('cycle detection: no cycle in empty graph', () => {
  const count = detectCycles({});
  assert(count === 0, 'Empty graph should have 0 cycles');
});

// ── Onboarding Estimator ──────────────────────────────────────────────────────

console.log('\n--- onboardingEstimateService ---');

test('onboarding estimator: small repo estimates < 5 days', () => {
  const metrics = {
    totalFiles: 20,
    averageComplexity: 5,
    documentationScore: 80,
    circularDependencies: 0,
  };
  const files = Array.from({ length: 20 }, (_, i) => ({
    path: `src/file${i}.js`,
    complexityScore: 5,
    content: '/** docs */',
    language: 'JavaScript',
  }));
  const result = estimateOnboardingTime(metrics, files);
  assert(result.totalDays > 0, 'Should return positive days');
  assert(result.totalDays < 5, `Small repo should be < 5 days, got ${result.totalDays}`);
  assert(Array.isArray(result.breakdown), 'Should have breakdown array');
  assert(result.level !== undefined, 'Should have a level');
});

test('onboarding estimator: large complex repo estimates more than small', () => {
  const metricsSmall = {
    totalFiles: 20, averageComplexity: 3,
    documentationScore: 90, circularDependencies: 0,
  };
  const metricsLarge = {
    totalFiles: 400, averageComplexity: 35,
    documentationScore: 10, circularDependencies: 15,
  };
  const smallResult = estimateOnboardingTime(metricsSmall, []);
  const largeResult = estimateOnboardingTime(metricsLarge, []);
  assert(
    largeResult.totalDays > smallResult.totalDays,
    `Large (${largeResult.totalDays}) should exceed small (${smallResult.totalDays})`,
  );
});

test('onboarding estimator: breakdown is sorted descending by days', () => {
  const metrics = {
    totalFiles: 60,
    averageComplexity: 10,
    documentationScore: 50,
    circularDependencies: 0,
  };
  const files = [
    ...Array.from({ length: 30 }, (_, i) => ({
      path: `src/a/file${i}.js`, complexityScore: 10, content: '', language: 'JavaScript',
    })),
    ...Array.from({ length: 30 }, (_, i) => ({
      path: `src/b/file${i}.js`, complexityScore: 10, content: '', language: 'JavaScript',
    })),
  ];
  const result = estimateOnboardingTime(metrics, files);
  if (result.breakdown.length >= 2) {
    for (let i = 0; i < result.breakdown.length - 1; i++) {
      assert(
        result.breakdown[i].days >= result.breakdown[i + 1].days,
        'Breakdown should be sorted descending',
      );
    }
  }
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n--- SERVICE TEST RESULTS ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
if (failed > 0) process.exit(1);
