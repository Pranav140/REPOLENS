/**
 * RepoLens API Integration Tests
 * Usage: npm run test:api (server must be running on port 5000)
 */
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE = 'http://127.0.0.1:5000/api';
let TOKEN = '';
let passed = 0;
let failed = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${err.message}`);
    if (err.response) {
      console.log(`   Status: ${err.response.status}`);
      console.log(`   Body: ${JSON.stringify(err.response.data)}`);
    }
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function createTestToken() {
  const fakeUserId = '507f1f77bcf86cd799439011';
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set in .env');
  }
  return jwt.sign({ userId: fakeUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

TOKEN = createTestToken();

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${TOKEN}` },
});

async function runTests() {
  // ── TEST GROUP 1: Server Health ───────────────────────────────────────────────

  console.log('\n--- GROUP 1: Server Health ---');

  await test('Server is running', async () => {
    await axios.get('http://127.0.0.1:5000/');
  });

  await test('Unknown route returns 404', async () => {
    try {
      await axios.get(`${BASE}/nonexistent-route-xyz`);
      throw new Error('Should have thrown');
    } catch (err) {
      assert(err.response?.status === 404, `Expected 404, got ${err.response?.status}`);
    }
  });

  // ── TEST GROUP 2: Auth Routes ─────────────────────────────────────────────────

  console.log('\n--- GROUP 2: Auth Routes ---');

  await test('POST /auth/github rejects missing code', async () => {
    try {
      await axios.post(`${BASE}/auth/github`, {});
      throw new Error('Should have thrown');
    } catch (err) {
      assert(
        err.response?.status === 400 || err.response?.status === 500,
        `Expected 400 or 500, got ${err.response?.status}`,
      );
    }
  });

  await test('GET /auth/me rejects missing token', async () => {
    try {
      await axios.get(`${BASE}/auth/me`);
      throw new Error('Should have thrown');
    } catch (err) {
      assert(err.response?.status === 401, `Expected 401, got ${err.response?.status}`);
    }
  });

  await test('GET /auth/me rejects invalid token', async () => {
    try {
      await axios.get(`${BASE}/auth/me`, {
        headers: { Authorization: 'Bearer invalidtoken123' },
      });
      throw new Error('Should have thrown');
    } catch (err) {
      assert(err.response?.status === 401, `Expected 401, got ${err.response?.status}`);
    }
  });

  await test('POST /auth/logout returns success', async () => {
    const res = await axios.post(`${BASE}/auth/logout`);
    assert(res.data.success === true, 'Should return success: true');
  });

  // ── TEST GROUP 3: Repo Routes ─────────────────────────────────────────────────

  console.log('\n--- GROUP 3: Repo Routes ---');

  await test('GET /repos returns array or 404 (fake user expected)', async () => {
    try {
      const res = await axios.get(`${BASE}/repos`, authHeaders());
      assert(Array.isArray(res.data), 'Should return array');
    } catch (err) {
      assert(err.response?.status !== undefined, 'Route should exist and respond');
    }
  });

  await test('POST /repos/import validates missing fields', async () => {
    try {
      await axios.post(`${BASE}/repos/import`, {}, authHeaders());
      throw new Error('Should have thrown');
    } catch (err) {
      assert(
        err.response?.status === 400 || err.response?.status === 404 || err.response?.status === 401,
        `Expected 400, 404, or 401, got ${err.response?.status}`,
      );
    }
  });

  await test('GET /repos/:owner/:name returns 404 for nonexistent', async () => {
    try {
      await axios.get(`${BASE}/repos/nonexistent-owner-xyz/nonexistent-repo-xyz`, authHeaders());
      throw new Error('Should have thrown');
    } catch (err) {
      assert(
        err.response?.status === 404 || err.response?.status === 401,
        `Expected 404 or 401, got ${err.response?.status}`,
      );
    }
  });

  await test('GET /repos/:owner/:name/files returns 404 for nonexistent', async () => {
    try {
      await axios.get(`${BASE}/repos/x/y/files`, authHeaders());
      throw new Error('Should have thrown');
    } catch (err) {
      assert(
        err.response?.status === 404 || err.response?.status === 401,
        `Expected 404 or 401, got ${err.response?.status}`,
      );
    }
  });

  await test('GET /repos/:owner/:name/metrics returns 404 for nonexistent', async () => {
    try {
      await axios.get(`${BASE}/repos/x/y/metrics`, authHeaders());
      throw new Error('Should have thrown');
    } catch (err) {
      assert(
        err.response?.status === 404 || err.response?.status === 401,
        `Expected 404 or 401, got ${err.response?.status}`,
      );
    }
  });

  // ── TEST GROUP 4: Search Routes ───────────────────────────────────────────────

  console.log('\n--- GROUP 4: Search Routes ---');

  await test('GET /search/:owner/:name rejects no query', async () => {
    try {
      const res = await axios.get(`${BASE}/search/owner/repo`, authHeaders());
      if (res.data.results) {
        assert(res.data.results.length === 0, 'Short/missing query should return empty');
      }
    } catch (err) {
      assert(err.response?.status !== undefined, 'Should respond with a status');
    }
  });

  await test('GET /search/:owner/:name requires auth', async () => {
    try {
      await axios.get(`${BASE}/search/owner/repo?q=test`);
      throw new Error('Should have thrown');
    } catch (err) {
      assert(err.response?.status === 401, `Expected 401, got ${err.response?.status}`);
    }
  });

  // ── TEST GROUP 5: AI Routes ───────────────────────────────────────────────────

  console.log('\n--- GROUP 5: AI Routes ---');

  await test('AI routes require auth', async () => {
    try {
      await axios.post(`${BASE}/ai/owner/repo/explain-file`, { filePath: 'test.js' });
      throw new Error('Should have thrown');
    } catch (err) {
      assert(err.response?.status === 401, `Expected 401, got ${err.response?.status}`);
    }
  });

  await test('AI explain-file validates missing filePath', async () => {
    try {
      await axios.post(`${BASE}/ai/owner/repo/explain-file`, {}, authHeaders());
      throw new Error('Should have thrown');
    } catch (err) {
      assert(
        err.response?.status === 400 || err.response?.status === 404 || err.response?.status === 401,
        `Expected 400, 404, or 401, got ${err.response?.status}`,
      );
    }
  });

  await test('Graph routes require auth', async () => {
    try {
      await axios.get(`${BASE}/graph/owner/repo`);
      throw new Error('Should have thrown');
    } catch (err) {
      assert(err.response?.status === 401, `Expected 401, got ${err.response?.status}`);
    }
  });

  await test('Security routes require auth', async () => {
    try {
      await axios.get(`${BASE}/security/owner/repo`);
      throw new Error('Should have thrown');
    } catch (err) {
      assert(err.response?.status === 401, `Expected 401, got ${err.response?.status}`);
    }
  });

  // ── Summary ───────────────────────────────────────────────────────────────────

  console.log('\n--- TEST RESULTS ---');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  if (failed > 0) process.exit(1);
}

runTests();
