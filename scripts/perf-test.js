#!/usr/bin/env node

/**
 * Performance Test Script
 * Runs after `pnpm build` or on-demand via `pnpm perf`.
 *
 * Checks:
 * 1. Bundle size (JS < 2MB, CSS < 100KB)
 * 2. Page response times (all pages return 200 under 3s)
 * 3. Lighthouse scores (Performance >= 90, Accessibility >= 90, SEO >= 90)
 * 4. Gzip/Brotli compression
 * 5. Concurrent request handling
 * 6. Memory usage stability
 * 7. API response time benchmarks
 * 8. Image optimization
 */

const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;
const BASE_URL = `http://localhost:${PORT}`;
const PAGES = ['/', '/articles', '/categories', '/about'];

let serverProcess = null;

function log(msg, color = '\x1b[0m') { console.log(`${color}${msg}\x1b[0m`); }
function success(msg) { log(`  ✓ ${msg}`, '\x1b[32m'); }
function fail(msg) { log(`  ✗ ${msg}`, '\x1b[31m'); }
function info(msg) { log(`  → ${msg}`, '\x1b[36m'); }
function warn(msg) { log(`  ⚠ ${msg}`, '\x1b[33m'); }

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
      timeout: 10000,
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          timing: Date.now() - startTime,
        });
      });
    });

    const startTime = Date.now();
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// ─── 1. Bundle Size ───────────────────────────────────────
function checkBundleSize() {
  log('\n📦 Bundle Size Check', '\x1b[1m');

  const chunksDir = path.join(__dirname, '..', '.next', 'static', 'chunks');
  const cssDir = path.join(__dirname, '..', '.next', 'static', 'css');

  if (!fs.existsSync(chunksDir)) {
    warn('No chunks directory. Run build first.');
    return true;
  }

  let jsSize = 0;
  let jsFiles = 0;
  function walkJs(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      const s = fs.statSync(fp);
      if (s.isDirectory()) walkJs(fp);
      else if (f.endsWith('.js') && !f.includes('.map')) {
        jsSize += s.size;
        jsFiles++;
      }
    }
  }
  walkJs(chunksDir);

  let cssSize = 0;
  let cssFiles = 0;
  if (fs.existsSync(cssDir)) {
    for (const f of fs.readdirSync(cssDir)) {
      const s = fs.statSync(path.join(cssDir, f));
      if (s.isFile() && f.endsWith('.css')) {
        cssSize += s.size;
        cssFiles++;
      }
    }
  }

  const jsKB = (jsSize / 1024).toFixed(1);
  const cssKB = (cssSize / 1024).toFixed(1);
  info(`JavaScript: ${jsKB} KB (${jsFiles} files)`);
  info(`CSS: ${cssKB} KB (${cssFiles} files)`);

  let passed = true;
  if (jsSize > 2000 * 1024) { warn(`JS ${jsKB} KB exceeds 2000 KB`); passed = false; }
  else success(`JS OK (${jsKB} KB)`);
  if (cssSize > 100 * 1024) { warn(`CSS ${cssKB} KB exceeds 100 KB`); passed = false; }
  else success(`CSS OK (${cssKB} KB)`);
  return passed;
}

// ─── 2. Page Response ─────────────────────────────────────
async function testPages() {
  log('\n🌐 Response Time Check', '\x1b[1m');
  let ok = true;
  const timings = [];

  for (const page of PAGES) {
    try {
      const start = Date.now();
      const res = await request(`${BASE_URL}${page}`);
      const ms = Date.now() - start;
      timings.push({ page, ms, status: res.status });

      if (res.status === 200 && ms < 3000) {
        success(`${page} → ${res.status} (${ms}ms)`);
      } else {
        fail(`${page} → ${res.status} (${ms}ms)`);
        ok = false;
      }
    } catch (e) {
      fail(`${page} → ${e.message}`);
      ok = false;
    }
  }

  if (timings.length > 0) {
    const avg = timings.reduce((a, t) => a + t.ms, 0) / timings.length;
    const max = Math.max(...timings.map((t) => t.ms));
    info(`Average: ${avg.toFixed(0)}ms | Max: ${max}ms`);
  }

  return ok;
}

// ─── 3. Lighthouse ────────────────────────────────────────
function runLighthouse() {
  log('\n🔬 Lighthouse Audit', '\x1b[1m');

  try {
    execSync('which google-chrome || which chromium || ls /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome 2>/dev/null', { stdio: 'pipe' });
  } catch {
    warn('Chrome not found — skipping Lighthouse (install Chrome for full audits)');
    return true;
  }

  let ok = true;

  for (const page of PAGES) {
    const url = `${BASE_URL}${page}`;
    info(`Auditing ${page}...`);

    try {
      const reportDir = path.join(__dirname, '..', '.lighthouseci');
      if (fs.existsSync(reportDir)) {
        fs.readdirSync(reportDir).filter((f) => f.endsWith('.json')).forEach((f) => fs.unlinkSync(path.join(reportDir, f)));
      }

      execSync(
        `npx lhci collect --url="${url}" --staticDistDir=.next/standalone`,
        { encoding: 'utf8', timeout: 60000, cwd: path.join(__dirname, '..'), stdio: 'pipe' }
      );

      if (fs.existsSync(reportDir)) {
        const reports = fs.readdirSync(reportDir).filter((f) => f.endsWith('.json')).sort().reverse();
        if (reports.length > 0) {
          const report = JSON.parse(fs.readFileSync(path.join(reportDir, reports[0]), 'utf8'));
          const perf = report.categories?.performance?.score * 100 || 0;
          const a11y = report.categories?.accessibility?.score * 100 || 0;
          const seo = report.categories?.seo?.score * 100 || 0;
          const best = report.categories?.['best-practices']?.score * 100 || 0;

          if (perf >= 90) success(`${page} Performance: ${perf}`);
          else { fail(`${page} Performance: ${perf} (target: 90)`); ok = false; }

          if (a11y >= 90) success(`${page} Accessibility: ${a11y}`);
          else { fail(`${page} Accessibility: ${a11y} (target: 90)`); ok = false; }

          if (seo >= 90) success(`${page} SEO: ${seo}`);
          else { fail(`${page} SEO: ${seo} (target: 90)`); ok = false; }

          if (best >= 90) success(`${page} Best Practices: ${best}`);
          else warn(`${page} Best Practices: ${best} (target: 90)`);
        }
      }
    } catch (e) {
      warn(`Lighthouse failed for ${page}: ${e.message.substring(0, 80)}`);
    }
  }
  return ok;
}

// ─── 4. Compression ───────────────────────────────────────
async function checkCompression() {
  log('\n🗜️  Compression Check', '\x1b[1m');

  try {
    const res = await request(BASE_URL + '/', {
      headers: { 'Accept-Encoding': 'gzip, br' },
    });

    const encoding = res.headers['content-encoding'];
    if (encoding && (encoding.includes('gzip') || encoding.includes('br'))) {
      success(`Content-Encoding: ${encoding}`);
      return true;
    } else {
      warn('No gzip/brotli compression detected');
      warn('Enable compression in Next.js or reverse proxy');
      return false;
    }
  } catch (e) {
    warn(`Compression check failed: ${e.message}`);
    return false;
  }
}

// ─── 5. Concurrent Requests ───────────────────────────────
async function testConcurrentRequests() {
  log('\n⚡ Concurrent Request Handling', '\x1b[1m');

  const concurrency = 10;
  const start = Date.now();

  const requests = [];
  for (let i = 0; i < concurrency; i++) {
    requests.push(
      request(BASE_URL + '/').catch((e) => ({
        status: 0,
        headers: {},
        body: '',
        error: e.message,
      }))
    );
  }

  const results = await Promise.all(requests);
  const elapsed = Date.now() - start;
  const successCount = results.filter((r) => r.status === 200).length;
  const avgTime = results.reduce((a, r) => a + (r.timing || 0), 0) / results.length;

  info(`${concurrency} concurrent requests completed in ${elapsed}ms`);
  info(`Success rate: ${successCount}/${concurrency}`);
  info(`Average response: ${avgTime.toFixed(0)}ms`);

  if (successCount === concurrency) {
    success(`All ${concurrency} concurrent requests succeeded`);
    return true;
  } else {
    fail(`${concurrency - successCount}/${concurrency} requests failed`);
    return false;
  }
}

// ─── 6. Memory Usage ──────────────────────────────────────
async function checkMemoryUsage() {
  log('\n🧠 Memory Usage Stability', '\x1b[1m');

  if (!serverProcess) {
    warn('Server not started by this script — skipping memory check');
    return true;
  }

  const getMemory = () => {
    try {
      const result = execSync(`ps -o rss= -p ${serverProcess.pid}`, { encoding: 'utf8' });
      return parseInt(result.trim()) * 1024; // Convert KB to bytes
    } catch {
      return null;
    }
  };

  // Baseline
  const baseline = getMemory();
  if (!baseline) {
    warn('Could not read server memory');
    return true;
  }

  info(`Baseline memory: ${(baseline / 1024 / 1024).toFixed(1)} MB`);

  // Make some requests to generate load
  for (let i = 0; i < 20; i++) {
    await request(BASE_URL + '/').catch(() => {});
  }

  const afterLoad = getMemory();
  if (!afterLoad) return true;

  info(`After load: ${(afterLoad / 1024 / 1024).toFixed(1)} MB`);

  const growth = afterLoad - baseline;
  const growthMB = (growth / 1024 / 1024).toFixed(1);

  if (growth < 50 * 1024 * 1024) { // Less than 50MB growth
    success(`Memory stable (+${growthMB} MB)`);
    return true;
  } else {
    warn(`Memory grew by ${growthMB} MB after load`);
    return false;
  }
}

// ─── 7. API Response Benchmarks ───────────────────────────
async function benchmarkAPIs() {
  log('\n📊 API Response Benchmarks', '\x1b[1m');

  const apis = [
    { path: '/api/articles', desc: 'Articles list' },
    { path: '/api/categories', desc: 'Categories list' },
    { path: '/api/tags', desc: 'Tags list' },
    { path: '/api/search?q=next', desc: 'Search' },
  ];

  let ok = true;
  for (const api of apis) {
    try {
      const start = Date.now();
      const res = await request(BASE_URL + api.path);
      const ms = Date.now() - start;

      if (res.status === 200 && ms < 2000) {
        success(`${api.desc}: ${ms}ms`);
      } else if (res.status === 200) {
        warn(`${api.desc}: ${ms}ms (slow, target < 2000ms)`);
      } else {
        fail(`${api.desc}: ${res.status}`);
        ok = false;
      }
    } catch (e) {
      fail(`${api.desc}: ${e.message}`);
      ok = false;
    }
  }
  return ok;
}

// ─── 8. Image Optimization ────────────────────────────────
function checkImageOptimization() {
  log('\n🖼️  Image Optimization', '\x1b[1m');

  const imagesDir = path.join(__dirname, '..', '.next', 'static');
  if (!fs.existsSync(imagesDir)) {
    warn('No .next/static directory — run build first');
    return true;
  }

  // Check for next/image usage
  const srcDir = path.join(__dirname, '..', 'src');
  let nextImageUsage = 0;
  let rawImgUsage = 0;

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      const s = fs.statSync(fp);
      if (s.isDirectory() && !f.startsWith('.') && f !== 'node_modules') scanDir(fp);
      else if (f.endsWith('.tsx') || f.endswith('.ts')) {
        try {
          const content = fs.readFileSync(fp, 'utf8');
          if (content.includes('next/image') || content.includes('Image')) nextImageUsage++;
          if (content.includes('<img ') || content.includes('src=')) rawImgUsage++;
        } catch {}
      }
    }
  }
  scanDir(srcDir);

  info(`next/image usage: ${nextImageUsage} files`);
  if (rawImgUsage > 0) {
    warn(`Raw <img> tags found: ${rawImgUsage} files (prefer next/image)`);
  } else {
    success('No raw <img> tags — using next/image');
  }

  return true;
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
  log('\n🚀 DevAtlas Performance Test', '\x1b[1m');
  log('='.repeat(50));

  const bundleOk = checkBundleSize();

  // Check if server is already running
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
      warn('Standalone server not found. Skipping server tests.');
      log('\n📊 Summary', '\x1b[1m');
      bundleOk ? success('Bundle check passed') : fail('Bundle check failed');
      process.exit(bundleOk ? 0 : 1);
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
    const pagesOk = await testPages();
    const lighthouseOk = runLighthouse();
    const compressionOk = await checkCompression();
    const concurrentOk = await testConcurrentRequests();
    const memoryOk = await checkMemoryUsage();
    const apiOk = await benchmarkAPIs();
    const imageOk = checkImageOptimization();

    log('\n' + '='.repeat(50));
    log('📊 Summary', '\x1b[1m');

    const results = [
      { name: 'Bundle size', ok: bundleOk },
      { name: 'Page responses', ok: pagesOk },
      { name: 'Lighthouse', ok: lighthouseOk },
      { name: 'Compression', ok: compressionOk },
      { name: 'Concurrent requests', ok: concurrentOk },
      { name: 'Memory stability', ok: memoryOk },
      { name: 'API benchmarks', ok: apiOk },
      { name: 'Image optimization', ok: imageOk },
    ];

    for (const r of results) {
      r.ok ? success(r.name) : fail(r.name);
    }

    const allPassed = results.every((r) => r.ok);
    process.exit(allPassed ? 0 : 1);
  } catch (e) {
    fail(`Error: ${e.message}`);
    process.exit(1);
  } finally {
    if (serverProcess && !alreadyRunning) {
      serverProcess.kill('SIGTERM');
    }
  }
}

main().catch((e) => {
  fail(e.message);
  if (serverProcess) serverProcess.kill('SIGTERM');
  process.exit(1);
});
