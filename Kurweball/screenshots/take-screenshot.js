const { chromium } = require('playwright');

(async () => {
  // Step 1: Get auth token from API directly
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'password123' }),
  });
  const loginData = await loginRes.json();
  console.log('Login OK, user:', loginData.user.email);

  // Step 2: Launch browser and inject auth into localStorage
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Navigate to the app first (localStorage requires same origin)
  await page.goto('http://localhost:3002/login');
  await page.waitForTimeout(1000);

  // Inject auth token and user into localStorage
  await page.evaluate((data) => {
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }, loginData);

  console.log('Auth injected into localStorage');

  // Step 3: Navigate to settings
  await page.goto('http://localhost:3002/settings');
  await page.waitForTimeout(4000);
  console.log('Settings URL:', page.url());

  // Check if we got redirected back to login
  if (page.url().includes('login')) {
    await page.screenshot({ path: 'screenshots/login-redirect-debug.png', fullPage: true });
    console.log('Redirected to login - saved debug screenshot');
  } else {
    // Take screenshot
    await page.screenshot({ path: 'screenshots/settings-page.png', fullPage: true });
    console.log('Screenshot saved to screenshots/settings-page.png');
  }

  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
