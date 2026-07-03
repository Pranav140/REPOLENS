require('dotenv').config();

const express = require('express');

// Load routes without starting server or connecting DB
const authRoutes = require('../src/routes/authRoutes');
const repoRoutes = require('../src/routes/repoRoutes');
const searchRoutes = require('../src/routes/searchRoutes');
const graphRoutes = require('../src/routes/graphRoutes');
const securityRoutes = require('../src/routes/securityRoutes');
const aiRoutes = require('../src/routes/aiRoutes');

let passed = 0;
let failed = 0;

function getRoutes(router) {
  const routes = [];
  router.stack?.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods);
      routes.push({
        path: layer.route.path,
        methods,
      });
    }
  });
  return routes;
}

function checkRoute(router, method, path) {
  const routes = getRoutes(router);
  const found = routes.find(
    (r) => r.path === path && r.methods.includes(method.toLowerCase()),
  );
  if (found) {
    console.log(`✅ ${method.toUpperCase()} ${path}`);
    passed++;
  } else {
    console.log(`❌ MISSING: ${method.toUpperCase()} ${path}`);
    console.log(
      `   Registered routes: ${routes
        .map((r) => `${Object.keys(r.methods).join('|').toUpperCase()} ${r.path}`)
        .join(', ')}`,
    );
    failed++;
  }
}

console.log('\n--- AUTH ROUTES ---');
checkRoute(authRoutes, 'post', '/github');
checkRoute(authRoutes, 'get', '/me');
checkRoute(authRoutes, 'post', '/logout');

console.log('\n--- REPO ROUTES ---');
checkRoute(repoRoutes, 'post', '/import');
checkRoute(repoRoutes, 'get', '/');
checkRoute(repoRoutes, 'get', '/:owner/:name');
checkRoute(repoRoutes, 'get', '/:owner/:name/files');
checkRoute(repoRoutes, 'get', '/:owner/:name/edges');
checkRoute(repoRoutes, 'get', '/:owner/:name/metrics');
checkRoute(repoRoutes, 'get', '/:owner/:name/status');
checkRoute(repoRoutes, 'delete', '/:owner/:name');
checkRoute(repoRoutes, 'post', '/:owner/:name/reanalyze');
checkRoute(repoRoutes, 'get', '/:owner/:name/blast-radius');
checkRoute(repoRoutes, 'get', '/:owner/:name/refactor-analysis');
checkRoute(repoRoutes, 'get', '/:owner/:name/onboarding-estimate');
checkRoute(repoRoutes, 'get', '/:owner/:name/dependencies');

console.log('\n--- SEARCH ROUTES ---');
checkRoute(searchRoutes, 'get', '/:owner/:name');

console.log('\n--- GRAPH ROUTES ---');
checkRoute(graphRoutes, 'get', '/:owner/:name');
checkRoute(graphRoutes, 'get', '/:owner/:name/trace');
checkRoute(graphRoutes, 'get', '/:owner/:name/file');
checkRoute(graphRoutes, 'get', '/:owner/:name/hotspots');

console.log('\n--- SECURITY ROUTES ---');
checkRoute(securityRoutes, 'get', '/:owner/:name');

console.log('\n--- AI ROUTES ---');
checkRoute(aiRoutes, 'post', '/:owner/:name/explain-file');
checkRoute(aiRoutes, 'post', '/:owner/:name/onboarding-guide');
checkRoute(aiRoutes, 'post', '/:owner/:name/architecture-summary');
checkRoute(aiRoutes, 'post', '/:owner/:name/analyze-pr');
checkRoute(aiRoutes, 'post', '/:owner/:name/score-readme');
checkRoute(aiRoutes, 'post', '/:owner/:name/dependency-summary');
checkRoute(aiRoutes, 'post', '/:owner/:name/explain-refactor');
checkRoute(aiRoutes, 'post', '/:owner/:name/narrate-onboarding');
checkRoute(aiRoutes, 'post', '/:owner/:name/breaking-changes');

console.log(`\n--- ROUTE CHECK RESULTS ---`);
console.log(`Found: ${passed}`);
console.log(`Missing: ${failed}`);
if (failed > 0) process.exit(1);
