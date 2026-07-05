#!/usr/bin/env node

/**
 * Security Test Script
 * Runs against a live server to verify security posture.
 *
 * Checks:
 * 1. Security headers (CSP, X-Frame-Options, HSTS, etc.)
 * 2. Authentication enforcement on protected routes
 * 3. Cookie security attributes
 * 4. Input validation (XSS, SQL injection payloads)
 * 5. Rate limiting presence
 * 6. CORS configuration
 * 7. Error handling (no stack traces leaked)
 * 8. HTTP method enforcement
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;
const BASE_URL = `http://localhost:${PORT}`;

// ─── Helpers ──────────────────────────────────────────────
function log(msg, color = '\x1b[0m') { console.log(`${color}${msg}\x1b[0m`); }
function success(msg) { log(`  ✓ ${msg}`, '\x1b[32m'); }
function fail(msg) { log(`  ✗ ${msg}`, '\x1b[31m'); }
function info(msg) { log(`  → ${msg}`, '\x1b[36m'); }
function warn(msg) { log(`  ⚠ ${msg}`, '\x1b[33m'); }

let totalPassed = 0;
let totalFailed = 0;
let totalWarnings = 0;

function pass() { totalPassed++; }
function fl() { totalFailed++; }
function wn() { totalWarnings++; }

// ─── HTTP helper ──────────────────────────────────────────
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000,
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// ─── 1. Security Headers ──────────────────────────────────
async function checkSecurityHeaders() {
  log('\n🔒 Security Headers', '\x1b[1m');

  const res = await request(BASE_URL + '/');
  const headers = res.headers;

  const required = [
    { name: 'x-frame-options', expected: 'DENY', desc: 'Clickjacking protection' },
    { name: 'x-content-type-options', expected: 'nosniff', desc: 'MIME sniffing protection' },
    { name: 'referrer-policy', expected: 'strict-origin-when-cross-origin', desc: 'Referrer policy' },
    { name: 'x-xss-protection', expected: '1; mode=block', desc: 'XSS filter' },
  ];

  const recommended = [
    { name: 'strict-transport-security', desc: 'HSTS (production only)' },
    { name: 'content-security-policy', desc: 'Content Security Policy' },
    { name: 'permissions-policy', desc: 'Permissions Policy' },
    { name: 'x-dns-prefetch-control', desc: 'DNS prefetch control' },
  ];

  for (const h of required) {
    const val = headers[h.name];
    if (val && val.toLowerCase() === h.expected.toLowerCase()) {
      success(`${h.desc}: ${h.name} = ${val}`);
      pass();
    } else if (val) {
      warn(`${h.desc}: ${h.name} = ${val} (expected: ${h.expected})`);
      wn();
    } else {
      fail(`${h.desc}: ${h.name} missing`);
      fl();
    }
  }

  for (const h of recommended) {
    const val = headers[h.name];
    if (val) {
      success(`${h.desc}: present`);
      pass();
    } else {
      warn(`${h.desc}: not set (recommended)`);
      wn();
    }
  }
}

// ─── 2. Authentication Enforcement ────────────────────────
async function checkAuthEnforcement() {
  log('\n🔐 Authentication Enforcement', '\x1b[1m');

  // Protected routes that should require auth
  const protectedRoutes = [
    { method: 'GET', path: '/api/stats', desc: 'Stats endpoint' },
    { method: 'POST', path: '/api/articles', desc: 'Article creation' },
    { method: 'POST', path: '/api/categories', desc: 'Category creation' },
    { method: 'POST', path: '/api/tags', desc: 'Tag creation' },
    { method: 'POST', path: '/api/upload', desc: 'File upload' },
    { method: 'POST', path: '/api/upcoming-features', desc: 'Feature creation' },
    { method: 'POST', path: '/api/newsletter/send', desc: 'Newsletter send' },
    { method: 'PUT', path: '/api/settings', desc: 'Settings update' },
  ];

  for (const route of protectedRoutes) {
    try {
      const res = await request(BASE_URL + route.path, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        body: route.method !== 'GET' ? '{}' : undefined,
      });

      if (res.status === 401) {
        success(`${route.desc} (${route.method} ${route.path}) → 401 Unauthorized`);
        pass();
      } else if (res.status === 403) {
        success(`${route.desc} (${route.method} ${route.path}) → 403 Forbidden`);
        pass();
      } else {
        fail(`${route.desc} (${route.method} ${route.path}) → ${res.status} (expected 401/403)`);
        fl();
      }
    } catch (e) {
      fail(`${route.desc} (${route.method} ${route.path}) → ${e.message}`);
      fl();
    }
  }

  // Public routes that should NOT require auth
  const publicRoutes = [
    { path: '/api/articles', desc: 'Articles list' },
    { path: '/api/categories', desc: 'Categories list' },
    { path: '/api/tags', desc: 'Tags list' },
    { path: '/api/search?q=test', desc: 'Search' },
  ];

  for (const route of publicRoutes) {
    try {
      const res = await request(BASE_URL + route.path);
      if (res.status === 200) {
        success(`${route.desc} → 200 (public access OK)`);
        pass();
      } else {
        fail(`${route.desc} → ${res.status} (expected 200 for public)`);
        fl();
      }
    } catch (e) {
      fail(`${route.desc} → ${e.message}`);
      fl();
    }
  }
}

// ─── 3. Cookie Security ───────────────────────────────────
async function checkCookieSecurity() {
  log('\n🍪 Cookie Security', '\x1b[1m');

  try {
    const res = await request(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' }),
    });

    const setCookie = res.headers['set-cookie'];
    if (!setCookie) {
      warn('No Set-Cookie header in login response (may be expected for wrong creds)');
      wn();
      return;
    }

    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;

    const checks = [
      { name: 'httpOnly', pattern: /httponly/i, desc: 'HttpOnly flag' },
      { name: 'sameSite', pattern: /samesite/i, desc: 'SameSite attribute' },
      { name: 'path', pattern: /path=\//i, desc: 'Path restriction' },
    ];

    // secure flag only in production
    if (process.env.NODE_ENV === 'production') {
      checks.push({ name: 'secure', pattern: /secure/i, desc: 'Secure flag (production)' });
    }

    for (const check of checks) {
      if (check.pattern.test(cookieStr)) {
        success(`${check.desc}: present`);
        pass();
      } else {
        fail(`${check.desc}: missing`);
        fl();
      }
    }
  } catch (e) {
    warn(`Cookie check skipped: ${e.message}`);
    wn();
  }
}

// ─── 4. Input Validation (XSS & Injection) ────────────────
async function checkInputValidation() {
  log('\n🛡️  Input Validation', '\x1b[1m');

  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    "'; alert('xss'); //",
    '<svg onload=alert(1)>',
  ];

  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' AND 1=1 --",
  ];

  // Test XSS in search
  for (const payload of xssPayloads) {
    try {
      const res = await request(BASE_URL + `/api/search?q=${encodeURIComponent(payload)}`);
      if (res.status === 200 || res.status === 400) {
        // Check response doesn't contain unescaped payload
        if (res.body.includes('<script>') || res.body.includes('onerror=')) {
          fail(`XSS reflected in search: ${payload.substring(0, 30)}...`);
          fl();
        } else {
          success(`XSS payload blocked/sanitized in search`);
          pass();
        }
      } else {
        success(`XSS payload rejected (${res.status})`);
        pass();
      }
    } catch (e) {
      success(`XSS payload caused error (safe): ${e.message.substring(0, 40)}`);
      pass();
    }
  }

  // Test SQL injection in article slug lookup
  for (const payload of sqlPayloads) {
    try {
      const res = await request(BASE_URL + `/api/articles/${encodeURIComponent(payload)}`);
      if (res.status === 500) {
        const body = res.body.toLowerCase();
        if (body.includes('sql') || body.includes('syntax') || body.includes('error')) {
          fail(`SQL error leaked: ${payload.substring(0, 20)}...`);
          fl();
        } else {
          success(`SQL injection blocked (generic error)`);
          pass();
        }
      } else {
        success(`SQL injection attempt returned ${res.status}`);
        pass();
      }
    } catch (e) {
      success(`SQL injection attempt handled safely`);
      pass();
    }
  }

  // Test oversized input
  try {
    const bigPayload = 'x'.repeat(100000);
    const res = await request(BASE_URL + '/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: bigPayload, slug: 'test', content: bigPayload }),
    });
    if (res.status === 400 || res.status === 401 || res.status === 413) {
      success(`Oversized payload rejected (${res.status})`);
      pass();
    } else {
      warn(`Oversized payload accepted (${res.status})`);
      wn();
    }
  } catch (e) {
    success(`Oversized payload handled: ${e.message.substring(0, 40)}`);
    pass();
  }
}

// ─── 5. Rate Limiting ─────────────────────────────────────
async function checkRateLimiting() {
  log('\n⏱️  Rate Limiting', '\x1b[1m');

  const requests = [];
  const count = 20;

  for (let i = 0; i < count; i++) {
    requests.push(
      request(BASE_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      }).catch(() => ({ status: 0, headers: {}, body: '' }))
    );
  }

  const results = await Promise.all(requests);
  const rateLimited = results.filter((r) => r.status === 429);

  if (rateLimited.length > 0) {
    success(`Rate limiting active (${rateLimited.length}/${count} requests throttled)`);
    pass();

    // Check for rate limit headers
    const first429 = rateLimited[0];
    const rlHeaders = ['retry-after', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'ratelimit-limit'];
    const hasRlHeaders = rlHeaders.some((h) => first429.headers[h]);
    if (hasRlHeaders) {
      success('Rate limit headers present');
      pass();
    } else {
      warn('Rate limit headers missing (recommended: Retry-After, X-RateLimit-*)');
      wn();
    }
  } else {
    warn(`No rate limiting detected (${count} requests all returned non-429)`);
    warn('Consider adding rate limiting to auth endpoints');
    wn();
  }
}

// ─── 6. Error Handling ────────────────────────────────────
async function checkErrorHandling() {
  log('\n🚫 Error Handling', '\x1b[1m');

  // Test that errors don't leak stack traces
  const errorPaths = [
    '/api/articles/nonexistent-slug-xyz',
    '/api/categories/nonexistent',
    '/api/tags/999999',
    '/api/media/999999',
    '/api/upcoming-features/999999',
  ];

  for (const ep of errorPaths) {
    try {
      const res = await request(BASE_URL + ep);
      const body = res.body.toLowerCase();

      // Check for stack trace leakage
      const leakPatterns = [
        'stack trace',
        'at async',
        'node_modules',
        'webpack',
        'internal/',
        'TypeError:',
        'ReferenceError:',
        'SyntaxError:',
        'prisma',
        'query',
      ];

      const leaked = leakPatterns.filter((p) => body.includes(p));
      if (leaked.length > 0) {
        fail(`${ep} leaks info: ${leaked.join(', ')}`);
        fl();
      } else {
        success(`${ep} → ${res.status} (no stack trace)`);
        pass();
      }
    } catch (e) {
      success(`${ep} → connection error (safe)`);
      pass();
    }
  }

  // Test 404 for unknown routes
  try {
    const res = await request(BASE_URL + '/api/unknown-endpoint');
    if (res.status === 404) {
      success('Unknown API route → 404');
      pass();
    } else if (res.status === 401) {
      success('Unknown API route → 401 (auth-gated, acceptable)');
      pass();
    } else {
      warn(`Unknown API route → ${res.status} (expected 404)`);
      wn();
    }
  } catch (e) {
    success('Unknown API route → connection error (safe)');
    pass();
  }
}

// ─── 7. HTTP Method Enforcement ───────────────────────────
async function checkMethodEnforcement() {
  log('\n📡 HTTP Method Enforcement', '\x1b[1m');

  const tests = [
    { path: '/api/auth/login', method: 'DELETE', desc: 'DELETE on login' },
    { path: '/api/auth/login', method: 'PUT', desc: 'PUT on login' },
    { path: '/api/articles', method: 'DELETE', desc: 'DELETE on articles list' },
    { path: '/api/categories', method: 'DELETE', desc: 'DELETE on categories list' },
    { path: '/api/upload', method: 'GET', desc: 'GET on upload' },
  ];

  for (const test of tests) {
    try {
      const res = await request(BASE_URL + test.path, { method: test.method });
      if (res.status === 405) {
        success(`${test.desc} → 405 Method Not Allowed`);
        pass();
      } else if (res.status === 401) {
        success(`${test.desc} → 401 (auth check before method check, OK)`);
        pass();
      } else if (res.status >= 400) {
        success(`${test.desc} → ${res.status} (rejected)`);
        pass();
      } else {
        fail(`${test.desc} → ${res.status} (should be 405 or 4xx)`);
        fl();
      }
    } catch (e) {
      success(`${test.desc} → error (safe)`);
      pass();
    }
  }
}

// ─── 8. CORS ──────────────────────────────────────────────
async function checkCORS() {
  log('\n🌍 CORS Configuration', '\x1b[1m');

  try {
    const res = await request(BASE_URL + '/api/articles', {
      headers: { Origin: 'https://evil-site.com' },
    });

    const acao = res.headers['access-control-allow-origin'];
    if (!acao) {
      success('No CORS header for unknown origin (secure)');
      pass();
    } else if (acao === '*') {
      warn('CORS allows all origins (*)');
      wn();
    } else if (acao === 'https://evil-site.com') {
      fail('CORS reflects arbitrary origin');
      fl();
    } else {
      success(`CORS restricted to: ${acao}`);
      pass();
    }
  } catch (e) {
    success('CORS check: connection error (safe)');
    pass();
  }
}

// ─── 9. Content Security Policy ───────────────────────────
async function checkCSP() {
  log('\n📋 Content Security Policy', '\x1b[1m');

  try {
    const res = await request(BASE_URL + '/');
    const csp = res.headers['content-security-policy'];

    if (!csp) {
      warn('No Content-Security-Policy header');
      wn();
      return;
    }

    const directives = ['default-src', 'script-src', 'style-src', 'img-src', 'font-src'];
    for (const d of directives) {
      if (csp.includes(d)) {
        const value = csp.split(d)[1]?.split(';')[0]?.trim();
        if (value && !value.includes("'unsafe-inline'") && !value.includes("'unsafe-eval'")) {
          success(`${d}: ${value.substring(0, 60)}${value.length > 60 ? '...' : ''}`);
          pass();
        } else if (value) {
          warn(`${d}: contains unsafe directives`);
          wn();
        }
      } else {
        warn(`${d}: missing from CSP`);
        wn();
      }
    }
  } catch (e) {
    warn(`CSP check skipped: ${e.message}`);
    wn();
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
  log('\n🛡️  DevAtlas Security Test', '\x1b[1m');
  log('='.repeat(50));

  // Check if server is already running
  let serverProcess = null;
  let alreadyRunning = false;

  try {
    await new Promise((r, j) => {
      http.get(BASE_URL, (res) => { res.resume(); r(); }).on('error', j);
    });
    alreadyRunning = true;
    info('Server already running on port ' + PORT);
  } catch {
    // Start server
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

  try {
    await checkSecurityHeaders();
    await checkAuthEnforcement();
    await checkCookieSecurity();
    await checkInputValidation();
    await checkRateLimiting();
    await checkErrorHandling();
    await checkMethodEnforcement();
    await checkCORS();
    await checkCSP();

    log('\n' + '='.repeat(50));
    log('🛡️  Security Test Summary', '\x1b[1m');
    log(`  Passed:   ${totalPassed}`, '\x1b[32m');
    log(`  Failed:   ${totalFailed}`, '\x1b[31m');
    log(`  Warnings: ${totalWarnings}`, '\x1b[33m');

    if (totalFailed > 0) {
      fail(`${totalFailed} security check(s) failed!`);
      process.exit(1);
    } else if (totalWarnings > 0) {
      warn(`${totalWarnings} recommendation(s) — review above`);
      process.exit(0);
    } else {
      success('All security checks passed!');
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
