const { chromium } = require('playwright');

const PAGES = [
  { name: 'login', url: '/login', needsAuth: false },
  { name: 'dashboard', url: '/dashboard' },
  { name: 'candidates', url: '/candidates' },
  { name: 'jobs', url: '/jobs' },
  { name: 'clients', url: '/clients' },
  { name: 'pipeline', url: '/pipeline' },
  { name: 'tasks', url: '/tasks' },
  { name: 'reports', url: '/reports' },
  { name: 'settings', url: '/settings' },
];

(async () => {
  const BASE = 'http://localhost:3002';
  const API = 'http://localhost:3001/api';

  // Get auth token
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'password123' }),
  });
  const loginData = await loginRes.json();
  console.log('Login OK, user:', loginData.user.email);

  // Get first candidate, job, client IDs for detail pages
  const token = loginData.accessToken;
  const headers = { Authorization: `Bearer ${token}` };

  const [candidatesRes, jobsRes, clientsRes] = await Promise.all([
    fetch(`${API}/candidates?limit=1`, { headers }),
    fetch(`${API}/jobs?limit=1`, { headers }),
    fetch(`${API}/clients?limit=1`, { headers }),
  ]);
  const candidates = await candidatesRes.json();
  const jobs = await jobsRes.json();
  const clients = await clientsRes.json();

  const firstCandidate = candidates.data?.[0] || candidates[0];
  const firstJob = jobs.data?.[0] || jobs[0];
  const firstClient = clients.data?.[0] || clients[0];

  if (firstCandidate) PAGES.push({ name: 'candidate-detail', url: `/candidates/${firstCandidate.id}` });
  if (firstJob) PAGES.push({ name: 'job-detail', url: `/jobs/${firstJob.id}` });
  if (firstClient) PAGES.push({ name: 'client-detail', url: `/clients/${firstClient.id}` });

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Take login page screenshot first (no auth needed)
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/login.png', fullPage: true });
  console.log('[1/' + PAGES.length + '] login.png');

  // Inject auth
  await page.evaluate((data) => {
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }, loginData);

  // Screenshot each authenticated page
  let count = 2;
  for (const pg of PAGES) {
    if (pg.needsAuth === false) continue;
    await page.goto(`${BASE}${pg.url}`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `screenshots/${pg.name}.png`, fullPage: true });
    console.log(`[${count}/${PAGES.length}] ${pg.name}.png`);
    count++;
  }

  await browser.close();
  console.log('\nAll screenshots saved to screenshots/');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
