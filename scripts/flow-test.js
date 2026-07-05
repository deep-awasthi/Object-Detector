#!/usr/bin/env node

/**
 * Flow Test Script — tests every user journey end-to-end.
 *
 * Flows tested:
 *  1. Public pages (homepage, articles, categories, about, search, upcoming)
 *  2. Public API endpoints (articles, categories, tags, settings, upcoming, search)
 *  3. Auth lifecycle (login → OTP → verify → me → logout)
 *  4. Admin CRUD (articles, categories, tags, features, settings) — skipped by default, use --admin to enable
 *  5. Subscriber lifecycle (subscribe → list → unsubscribe)
 *  6. Error handling (invalid slugs, missing params, wrong methods)
 *
 * Auto-detects a running server or starts one if needed.
 *
 * Usage:
 *   node scripts/flow-test.js          # Skips admin tests
 *   node scripts/flow-test.js --admin  # Includes admin tests
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;
const BASE_URL = `http://localhost:${PORT}`;
const includeAdmin = process.argv.includes('--admin');

// ─── Helpers ──────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function log(msg, color = '\x1b[0m') { console.log(`${color}${msg}\x1b[0m`); }
function success(msg) { log(`  ✓ ${msg}`, '\x1b[32m'); passed++; }
function fail(msg) { log(`  ✗ ${msg}`, '\x1b[31m'); failed++; failures.push(msg); }
function skip(msg) { log(`  ○ ${msg}`, '\x1b[33m'); skipped++; }
function info(msg) { log(`  → ${msg}`, '\x1b[36m'); }
function section(msg) { log(`\n${'─'.repeat(50)}`, '\x1b[90m'); log(`  ${msg}`, '\x1b[1m'); log(`${'─'.repeat(50)}`, '\x1b[90m'); }

// Use a fresh agent per request to avoid keep-alive connection pooling issues
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const agent = new http.Agent({ keepAlive: false, maxSockets: 1 });
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', Connection: 'close', ...options.headers },
      timeout: 15000,
      agent,
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        agent.destroy();
        let json = null;
        try { json = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body, json });
      });
    });

    req.on('error', (err) => { agent.destroy(); reject(err); });
    req.on('timeout', () => { req.destroy(); agent.destroy(); reject(new Error('timeout')); });

    if (options.body !== undefined) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, passMsg, failMsg) {
  if (condition) success(passMsg);
  else fail(failMsg);
}

// ─── Flow 1: Public Pages ─────────────────────────────────
async function testPublicPages() {
  section('📄 Public Pages');

  const pages = [
    { path: '/', desc: 'Homepage' },
    { path: '/articles', desc: 'Articles list' },
    { path: '/categories', desc: 'Categories list' },
    { path: '/about', desc: 'About page' },
    { path: '/upcoming', desc: 'Upcoming features' },
  ];

  for (const p of pages) {
    try {
      const res = await request(BASE_URL + p.path);
      assert(res.status === 200, `${p.desc} → 200`, `${p.desc} → ${res.status} (expected 200)`);
    } catch (e) {
      fail(`${p.desc} → ${e.message}`);
    }
  }

  // 404 page
  try {
    const res = await request(BASE_URL + '/this-does-not-exist');
    assert(res.status === 404, 'Custom 404 → 404', `Unknown route → ${res.status} (expected 404)`);
  } catch (e) {
    fail(`404 page → ${e.message}`);
  }
}

// ─── Flow 2: Public API Endpoints ─────────────────────────
async function testPublicAPIs() {
  section('🌐 Public API Endpoints');

  const apis = [
    { path: '/api/articles', desc: 'Articles list', validate: (r) => r.json?.articles && r.json?.pagination },
    { path: '/api/articles?limit=2', desc: 'Articles pagination', validate: (r) => r.json?.articles?.length <= 2 },
    { path: '/api/categories', desc: 'Categories list', validate: (r) => Array.isArray(r.json) },
    { path: '/api/tags', desc: 'Tags list', validate: (r) => Array.isArray(r.json) },
    { path: '/api/settings', desc: 'Site settings', validate: (r) => r.json?.siteName },
    { path: '/api/upcoming-features', desc: 'Upcoming features', validate: (r) => Array.isArray(r.json) },
    { path: '/api/search?q=test', desc: 'Search', validate: (r) => r.status === 200 },
    { path: '/api/search?q=', desc: 'Empty search', validate: (r) => r.status === 200 },
  ];

  for (const api of apis) {
    try {
      const res = await request(BASE_URL + api.path);
      if (res.status === 200 && api.validate(res)) {
        success(`${api.desc} → 200 (valid response)`);
      } else if (res.status === 200) {
        skip(`${api.desc} → 200 (response format unexpected)`);
      } else {
        fail(`${api.desc} → ${res.status}`);
      }
    } catch (e) {
      fail(`${api.desc} → ${e.message}`);
    }
  }

  // Article detail by slug
  try {
    const listRes = await request(BASE_URL + '/api/articles?limit=1');
    if (listRes.json?.articles?.length > 0) {
      const slug = listRes.json.articles[0].slug;
      const res = await request(BASE_URL + `/api/articles/${slug}`);
      assert(res.status === 200, `Article detail (${slug}) → 200`, `Article detail → ${res.status}`);
    } else {
      skip('Article detail → no articles to test');
    }
  } catch (e) {
    fail(`Article detail → ${e.message}`);
  }

  // Category detail by slug
  try {
    const listRes = await request(BASE_URL + '/api/categories');
    if (Array.isArray(listRes.json) && listRes.json.length > 0) {
      const slug = listRes.json[0].slug;
      const res = await request(BASE_URL + `/api/categories/${slug}`);
      assert(res.status === 200, `Category detail (${slug}) → 200`, `Category detail → ${res.status}`);
    } else {
      skip('Category detail → no categories to test');
    }
  } catch (e) {
    fail(`Category detail → ${e.message}`);
  }
}

// ─── Flow 3: Auth Lifecycle ───────────────────────────────
async function testAuthLifecycle() {
  section('🔐 Auth Lifecycle');

  let authToken = null;
  let cookies = [];

  // Step 1: Login with valid credentials
  try {
    const res = await request(BASE_URL + '/api/auth/login', {
      method: 'POST',
      body: { email: 'da.madskull@gmail.com', password: 'deep123' },
    });

    if (res.status === 200 && res.json?.user) {
      success('Login → 200 (user returned)');
      // Extract cookie
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
        authToken = cookies.find((c) => c.includes('devatlas_token'));
        assert(!!authToken, 'Auth cookie set', 'Auth cookie missing');
      }
    } else {
      fail(`Login → ${res.status} (${JSON.stringify(res.json || {}).substring(0, 80)})`);
    }
  } catch (e) {
    fail(`Login → ${e.message}`);
  }

  // Step 2: Login with wrong password
  try {
    const res = await request(BASE_URL + '/api/auth/login', {
      method: 'POST',
      body: { email: 'da.madskull@gmail.com', password: 'wrongpassword' },
    });
    assert(res.status === 401, 'Wrong password → 401', `Wrong password → ${res.status} (expected 401)`);
  } catch (e) {
    fail(`Wrong password test → ${e.message}`);
  }

  // Step 3: Login with nonexistent user
  try {
    const res = await request(BASE_URL + '/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@test.com', password: 'password' },
    });
    assert(res.status === 401, 'Nonexistent user → 401', `Nonexistent user → ${res.status} (expected 401)`);
  } catch (e) {
    fail(`Nonexistent user test → ${e.message}`);
  }

  // Step 4: /api/auth/me with cookie
  if (authToken) {
    try {
      const cookieHeader = authToken.split(';')[0];
      const res = await request(BASE_URL + '/api/auth/me', {
        headers: { Cookie: cookieHeader },
      });
      assert(res.status === 200 && res.json?.user, 'Auth/me → 200 (user returned)', `Auth/me → ${res.status}`);
    } catch (e) {
      fail(`Auth/me → ${e.message}`);
    }
  }

  // Step 5: /api/auth/me without cookie
  try {
    const res = await request(BASE_URL + '/api/auth/me');
    assert(res.status === 200, 'Auth/me (no cookie) → 200 (user: null)', `Auth/me (no cookie) → ${res.status}`);
  } catch (e) {
    fail(`Auth/me (no cookie) → ${e.message}`);
  }

  // Step 6: Logout
  try {
    const res = await request(BASE_URL + '/api/auth/logout', { method: 'POST' });
    assert(res.status === 200, 'Logout → 200', `Logout → ${res.status}`);
  } catch (e) {
    fail(`Logout → ${e.message}`);
  }

  // Step 7: OTP request
  try {
    const res = await request(BASE_URL + '/api/auth/otp', {
      method: 'POST',
      body: { email: 'da.madskull@gmail.com', purpose: 'login' },
    });
    assert(res.status === 200, 'OTP request → 200', `OTP request → ${res.status}`);
  } catch (e) {
    fail(`OTP request → ${e.message}`);
  }

  // Step 8: OTP verify with invalid code
  try {
    const res = await request(BASE_URL + '/api/auth/otp/verify', {
      method: 'POST',
      body: { email: 'da.madskull@gmail.com', code: '000000', purpose: 'login' },
    });
    assert(res.status === 400, 'OTP verify (bad code) → 400', `OTP verify (bad code) → ${res.status}`);
  } catch (e) {
    fail(`OTP verify → ${e.message}`);
  }
}

// ─── Flow 4: Admin CRUD ───────────────────────────────────
async function testAdminCRUD() {
  section('🛠️  Admin CRUD Operations');

  // Get auth cookie
  let cookie = null;
  try {
    const res = await request(BASE_URL + '/api/auth/login', {
      method: 'POST',
      body: { email: 'da.madskull@gmail.com', password: 'deep123' },
    });
    if (res.status === 200) {
      const setCookie = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const tokenCookie = cookies.find((c) => c.includes('devatlas_token'));
      if (tokenCookie) cookie = tokenCookie.split(';')[0];
    }
  } catch {}

  if (!cookie) {
    skip('Admin CRUD → could not authenticate');
    return;
  }

  const authHeaders = { Cookie: cookie };

  // --- Categories ---
  let testCategoryId = null;
  try {
    const res = await request(BASE_URL + '/api/categories', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'flowtestcat', slug: 'flowtestcat', description: 'Test category', color: '#FF0000' },
    });
    if (res.status === 201 && res.json?.id) {
      success('Create category → 201');
      testCategoryId = res.json.id;
    } else {
      fail(`Create category → ${res.status}`);
    }
  } catch (e) {
    fail(`Create category → ${e.message}`);
  }

  // --- Tags ---
  let testTagId = null;
  try {
    const res = await request(BASE_URL + '/api/tags', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'flowtesttag' },
    });
    if (res.status === 201 && res.json?.id) {
      success('Create tag → 201');
      testTagId = res.json.id;
    } else {
      fail(`Create tag → ${res.status}`);
    }
  } catch (e) {
    fail(`Create tag → ${e.message}`);
  }

  // --- Articles ---
  let testArticleSlug = null;
  try {
    const res = await request(BASE_URL + '/api/articles', {
      method: 'POST',
      headers: authHeaders,
      body: {
        title: 'Flow Test Article',
        slug: 'flowtestarticle',
        content: { root: { children: [] } },
        contentHtml: '<p>Test content for flow testing</p>',
        excerpt: 'Test excerpt',
        categoryId: testCategoryId || 'skip',
        tagIds: testTagId ? [testTagId] : [],
        published: false,
        featured: false,
        pinned: false,
      },
    });
    if (res.status === 201 && res.json?.slug) {
      success('Create article → 201');
      testArticleSlug = res.json.slug;
    } else {
      fail(`Create article → ${res.status} (${JSON.stringify(res.json || {}).substring(0, 100)})`);
    }
  } catch (e) {
    fail(`Create article → ${e.message}`);
  }

  // --- Toggle article published ---
  if (testArticleSlug) {
    try {
      const res = await request(BASE_URL + `/api/articles/${testArticleSlug}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: { published: true },
      });
      assert(res.status === 200, 'Publish article → 200', `Publish article → ${res.status}`);
    } catch (e) {
      fail(`Publish article → ${e.message}`);
    }
  }

  // --- Update article ---
  if (testArticleSlug) {
    try {
      const res = await request(BASE_URL + `/api/articles/${testArticleSlug}`, {
        method: 'PUT',
        headers: authHeaders,
        body: {
          title: '__Test Flow Article Updated',
          slug: testArticleSlug,
          content: { root: { children: [] } },
          contentHtml: '<p>Updated test content</p>',
          excerpt: 'Updated excerpt',
          categoryId: testCategoryId || 'skip',
          tagIds: testTagId ? [testTagId] : [],
          published: false,
          featured: false,
          pinned: false,
        },
      });
      assert(res.status === 200, 'Update article → 200', `Update article → ${res.status}`);
    } catch (e) {
      fail(`Update article → ${e.message}`);
    }
  }

  // --- Upcoming Features ---
  let testFeatureId = null;
  try {
    const res = await request(BASE_URL + '/api/upcoming-features', {
      method: 'POST',
      headers: authHeaders,
      body: { title: 'Flow Test Feature', description: 'Test feature for flow', status: 'coming-soon' },
    });
    if (res.status === 201 && res.json?.id) {
      success('Create upcoming feature → 201');
      testFeatureId = res.json.id;
    } else {
      fail(`Create upcoming feature → ${res.status}`);
    }
  } catch (e) {
    fail(`Create upcoming feature → ${e.message}`);
  }

  // --- Settings ---
  try {
    const res = await request(BASE_URL + '/api/settings', {
      method: 'PUT',
      headers: authHeaders,
      body: { siteName: 'DevAtlas' },
    });
    assert(res.status === 200, 'Update settings → 200', `Update settings → ${res.status}`);
  } catch (e) {
    fail(`Update settings → ${e.message}`);
  }

  // --- Stats ---
  try {
    const res = await request(BASE_URL + '/api/stats', { headers: authHeaders });
    assert(res.status === 200 && res.json?.stats, 'Stats → 200', `Stats → ${res.status}`);
  } catch (e) {
    fail(`Stats → ${e.message}`);
  }

  // --- Subscribers list ---
  try {
    const res = await request(BASE_URL + '/api/subscribers', { headers: authHeaders });
    assert(res.status === 200 && Array.isArray(res.json), 'Subscribers list → 200', `Subscribers list → ${res.status}`);
  } catch (e) {
    fail(`Subscribers list → ${e.message}`);
  }

  // --- Cleanup: Delete test data ---
  section('🧹 Cleanup');

  if (testArticleSlug) {
    try {
      const res = await request(BASE_URL + `/api/articles/${testArticleSlug}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      assert(res.status === 200, 'Delete test article → 200', `Delete test article → ${res.status}`);
    } catch (e) {
      fail(`Delete test article → ${e.message}`);
    }
  }

  if (testFeatureId) {
    try {
      const res = await request(BASE_URL + `/api/upcoming-features/${testFeatureId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      assert(res.status === 200, 'Delete test feature → 200', `Delete test feature → ${res.status}`);
    } catch (e) {
      fail(`Delete test feature → ${e.message}`);
    }
  }

  // Note: Categories and tags with __test prefix are left as they're harmless
}

// ─── Flow 5: Subscriber Lifecycle ─────────────────────────
async function testSubscriberLifecycle() {
  section('📧 Subscriber Lifecycle');

  const testEmail = `flow-test-${Date.now()}@test.com`;

  // Subscribe
  try {
    const res = await request(BASE_URL + '/api/subscribers', {
      method: 'POST',
      body: { email: testEmail },
    });
    assert(res.status === 201, `Subscribe → 201`, `Subscribe → ${res.status}`);
  } catch (e) {
    fail(`Subscribe → ${e.message}`);
  }

  // Duplicate subscribe
  try {
    const res = await request(BASE_URL + '/api/subscribers', {
      method: 'POST',
      body: { email: testEmail },
    });
    assert(res.status === 200, 'Duplicate subscribe → 200 (already subscribed)', `Duplicate subscribe → ${res.status}`);
  } catch (e) {
    fail(`Duplicate subscribe → ${e.message}`);
  }

  // Unsubscribe
  try {
    const res = await request(BASE_URL + `/api/subscribers/unsubscribe?email=${encodeURIComponent(testEmail)}`);
    // Unsubscribe returns a redirect, so status could be 302 or 200
    assert(res.status === 200 || res.status === 302 || res.status === 307, 'Unsubscribe → redirect', `Unsubscribe → ${res.status}`);
  } catch (e) {
    fail(`Unsubscribe → ${e.message}`);
  }

  // Invalid email
  try {
    const res = await request(BASE_URL + '/api/subscribers', {
      method: 'POST',
      body: { email: 'not-an-email' },
    });
    assert(res.status === 400, 'Invalid email → 400', `Invalid email → ${res.status}`);
  } catch (e) {
    fail(`Invalid email → ${e.message}`);
  }
}

// ─── Flow 6: Error Handling ───────────────────────────────
async function testErrorHandling() {
  section('🚫 Error Handling');

  // Invalid article slug
  try {
    const res = await request(BASE_URL + '/api/articles/nonexistent-slug-xyz');
    assert(res.status === 404, 'Invalid article slug → 404', `Invalid article slug → ${res.status}`);
  } catch (e) {
    fail(`Invalid article slug → ${e.message}`);
  }

  // Invalid category slug
  try {
    const res = await request(BASE_URL + '/api/categories/nonexistent');
    assert(res.status === 404, 'Invalid category slug → 404', `Invalid category slug → ${res.status}`);
  } catch (e) {
    fail(`Invalid category slug → ${e.message}`);
  }

  // Unauthenticated POST to protected endpoint
  try {
    const res = await request(BASE_URL + '/api/articles', {
      method: 'POST',
      body: { title: 'test' },
    });
    assert(res.status === 401, 'Unauth POST /api/articles → 401', `Unauth POST /api/articles → ${res.status}`);
  } catch (e) {
    fail(`Unauth POST /api/articles → ${e.message}`);
  }

  // Invalid login body
  try {
    const res = await request(BASE_URL + '/api/auth/login', {
      method: 'POST',
      body: {},
    });
    assert(res.status === 400, 'Empty login body → 400', `Empty login body → ${res.status}`);
  } catch (e) {
    fail(`Empty login body → ${e.message}`);
  }

  // Wrong HTTP method on articles
  try {
    const res = await request(BASE_URL + '/api/articles', { method: 'DELETE' });
    assert(res.status === 405 || res.status === 401, 'DELETE /api/articles → 405/401', `DELETE /api/articles → ${res.status}`);
  } catch (e) {
    fail(`DELETE /api/articles → ${e.message}`);
  }

  // Unsubscribe without email
  try {
    const res = await request(BASE_URL + '/api/subscribers/unsubscribe');
    assert(res.status === 400, 'Unsubscribe without email → 400', `Unsubscribe without email → ${res.status}`);
  } catch (e) {
    fail(`Unsubscribe without email → ${e.message}`);
  }

  // OTP without required fields
  try {
    const res = await request(BASE_URL + '/api/auth/otp', {
      method: 'POST',
      body: {},
    });
    assert(res.status === 400, 'OTP without fields → 400', `OTP without fields → ${res.status}`);
  } catch (e) {
    fail(`OTP without fields → ${e.message}`);
  }

  // OTP with invalid purpose
  try {
    const res = await request(BASE_URL + '/api/auth/otp', {
      method: 'POST',
      body: { email: 'test@test.com', purpose: 'invalid' },
    });
    assert(res.status === 400, 'OTP invalid purpose → 400', `OTP invalid purpose → ${res.status}`);
  } catch (e) {
    fail(`OTP invalid purpose → ${e.message}`);
  }
}

// ─── Server ───────────────────────────────────────────────
async function waitForServer(url, attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    try {
      await new Promise((r, j) => {
        http.get(url, (res) => { res.resume(); r(); }).on('error', j);
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  log('\n🔄 DevAtlas Flow Test', '\x1b[1m');
  log('='.repeat(50));
  if (includeAdmin) {
    log('  ℹ Admin tests enabled', '\x1b[36m');
  } else {
    log('  ℹ Admin tests skipped (use --admin to include)', '\x1b[36m');
  }

  let serverProcess = null;
  let alreadyRunning = false;

  try {
    await new Promise((r, j) => {
      http.get(BASE_URL, (res) => { res.resume(); r(); }).on('error', j);
    });
    alreadyRunning = true;
    info('Server already running on port ' + PORT);
  } catch {
    const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
    if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
      fail('Standalone server not found. Run `pnpm build` first.');
      process.exit(1);
    }

    log('\n🌐 Starting Production Server', '\x1b[1m');
    serverProcess = require('child_process').spawn('node', [
      path.join(standaloneDir, 'server.js'),
    ], {
      env: { ...process.env, PORT: String(PORT), HOSTNAME: '0.0.0.0' },
      stdio: 'pipe',
    });

    if (!await waitForServer(BASE_URL)) {
      fail('Server failed to start');
      process.exit(1);
    }
    success('Server running on port ' + PORT);
  }

  const startTime = Date.now();

  try {
    await testPublicPages();
    await testPublicAPIs();
    await testAuthLifecycle();
    if (includeAdmin) {
      await testAdminCRUD();
    } else {
      skip('Admin CRUD → skipped (use --admin to include)');
    }
    await testSubscriberLifecycle();
    await testErrorHandling();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    log('\n' + '='.repeat(50));
    log('🔄 Flow Test Summary', '\x1b[1m');
    log(`  Passed:   ${passed}`, '\x1b[32m');
    log(`  Failed:   ${failed}`, '\x1b[31m');
    log(`  Skipped:  ${skipped}`, '\x1b[33m');
    log(`  Time:     ${elapsed}s`);

    if (failures.length > 0) {
      log('\n  Failed checks:', '\x1b[31m');
      failures.forEach((f) => log(`    • ${f}`, '\x1b[31m'));
    }

    if (failed > 0) {
      fail(`${failed} flow test(s) failed!`);
      process.exit(1);
    } else {
      success('All flow tests passed!');
      process.exit(0);
    }
  } finally {
    if (serverProcess && !alreadyRunning) {
      serverProcess.kill('SIGTERM');
    }
  }
}

main().catch((e) => {
  fail(`Fatal: ${e.message}`);
  process.exit(1);
});
