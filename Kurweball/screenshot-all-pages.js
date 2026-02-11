const { chromium } = require('playwright');

const PAGES = [
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'candidates', path: '/candidates' },
  { name: 'jobs', path: '/jobs' },
  { name: 'clients', path: '/clients' },
  { name: 'pipeline', path: '/pipeline' },
  { name: 'interviews', path: '/interviews' },
  { name: 'search', path: '/search' },
  { name: 'tasks', path: '/tasks' },
  { name: 'reports', path: '/reports' },
  { name: 'notifications', path: '/notifications' },
  { name: 'team', path: '/team' },
  { name: 'settings', path: '/settings' },
];

async function main() {
  // First, get an auth token directly from the API
  console.log('Getting auth token from API...');
  const loginResp = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'password123' }),
  });
  const loginData = await loginResp.json();
  const token = loginData.accessToken;
  console.log('  Token obtained:', token ? 'yes' : 'no');

  if (!token) {
    console.error('  Login failed:', JSON.stringify(loginData));
    process.exit(1);
  }

  // Get entity IDs for detail pages
  let ids = {};
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    const [candResp, jobResp, clientResp] = await Promise.all([
      fetch('http://localhost:3001/api/candidates?limit=1', { headers }),
      fetch('http://localhost:3001/api/jobs?limit=1', { headers }),
      fetch('http://localhost:3001/api/clients?limit=1', { headers }),
    ]);
    const [candData, jobData, clientData] = await Promise.all([
      candResp.json(), jobResp.json(), clientResp.json(),
    ]);
    ids.candidateId = candData?.data?.[0]?.id;
    ids.jobId = jobData?.data?.[0]?.id;
    ids.clientId = clientData?.data?.[0]?.id;
    console.log('  Entity IDs:', JSON.stringify(ids));
  } catch (e) {
    console.log('  Warning: Could not fetch entity IDs:', e.message);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const screenshotDir = 'C:\\Outlook Claude\\Kurweball\\screenshots';

  // Step 1: Screenshot login page (before auth)
  console.log('01 - login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${screenshotDir}/01-login.png`, fullPage: true });

  // Step 2: Inject auth token into localStorage
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t);
  }, token);
  console.log('  Auth token injected into localStorage');

  // Step 3: Screenshot all dashboard pages
  let counter = 2;
  for (const pg of PAGES.slice(1)) {
    const num = String(counter).padStart(2, '0');
    console.log(`${num} - ${pg.name}...`);
    try {
      await page.goto(`http://localhost:3000${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/${num}-${pg.name}.png`, fullPage: true });
    } catch (e) {
      console.log(`   ERROR: ${e.message}`);
      try {
        await page.screenshot({ path: `${screenshotDir}/${num}-${pg.name}-error.png`, fullPage: true });
      } catch {}
    }
    counter++;
  }

  // Step 4: Screenshot detail pages
  const detailPages = [
    { name: 'candidate-detail', id: ids.candidateId, basePath: '/candidates' },
    { name: 'job-detail', id: ids.jobId, basePath: '/jobs' },
    { name: 'client-detail', id: ids.clientId, basePath: '/clients' },
  ];

  for (const dp of detailPages) {
    const num = String(counter).padStart(2, '0');
    if (dp.id) {
      console.log(`${num} - ${dp.name}...`);
      try {
        await page.goto(`http://localhost:3000${dp.basePath}/${dp.id}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${screenshotDir}/${num}-${dp.name}.png`, fullPage: true });
      } catch (e) {
        console.log(`   ERROR: ${e.message}`);
        try {
          await page.screenshot({ path: `${screenshotDir}/${num}-${dp.name}-error.png`, fullPage: true });
        } catch {}
      }
    } else {
      console.log(`${num} - ${dp.name}: SKIPPED (no ID)`);
    }
    counter++;
  }

  console.log(`\nDone! ${counter - 1} screenshots saved to ${screenshotDir}`);
  await browser.close();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
