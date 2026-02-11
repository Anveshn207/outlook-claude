const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Capture all console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture network errors
  page.on('requestfailed', req => {
    logs.push(`[NET-FAIL] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  // Capture all API responses
  page.on('response', res => {
    const url = res.url();
    if (url.includes('localhost:3001')) {
      logs.push(`[API-RESP] ${res.status()} ${res.url()}`);
    }
  });

  // Step 1: Go to login page
  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Step 2: Fill in login form
  console.log('2. Filling login form...');
  await page.fill('input[id="email"]', 'admin@acme.com');
  await page.fill('input[id="password"]', 'password123');

  // Step 3: Submit and wait
  console.log('3. Submitting login...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Step 4: Check where we are
  const currentUrl = page.url();
  console.log(`4. Current URL: ${currentUrl}`);

  // Step 5: Check localStorage
  const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
  const authUser = await page.evaluate(() => localStorage.getItem('auth_user'));
  console.log(`5. auth_token in localStorage: ${authToken ? authToken.substring(0, 30) + '...' : 'NULL'}`);
  console.log(`   auth_user in localStorage: ${authUser ? authUser.substring(0, 50) + '...' : 'NULL'}`);

  // Step 6: If we're on dashboard, wait for data to load
  if (currentUrl.includes('/dashboard')) {
    console.log('6. On dashboard, waiting for data...');
    await page.waitForTimeout(5000);

    // Check what the page shows
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('7. Page text (first 1000 chars):');
    console.log(bodyText);
  } else {
    console.log('6. NOT on dashboard - still on:', currentUrl);
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('7. Page text:', bodyText);
  }

  // Print all captured logs
  console.log('\n--- BROWSER LOGS ---');
  logs.forEach(l => console.log(l));

  await page.screenshot({ path: 'C:\\Outlook Claude\\Kurweball\\screenshots\\debug-after-login.png', fullPage: true });
  console.log('\nScreenshot saved to screenshots/debug-after-login.png');

  await browser.close();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
