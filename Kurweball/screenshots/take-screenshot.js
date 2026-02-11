const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Step 1: Go to login
  await page.goto('http://localhost:3002/login');
  await page.waitForTimeout(2000);

  // Debug: find form elements
  const inputs = await page.$$eval('input', els =>
    els.map(e => ({ id: e.id, name: e.name, type: e.type, placeholder: e.placeholder }))
  );
  console.log('Inputs:', JSON.stringify(inputs));

  // Fill login form
  const emailInput = await page.$('input[type="email"], input[name="email"], #email');
  const passwordInput = await page.$('input[type="password"], input[name="password"], #password');

  if (emailInput) {
    await emailInput.fill('admin@acme.com');
  } else {
    // Try first input
    const allInputs = await page.$$('input');
    if (allInputs.length >= 2) {
      await allInputs[0].fill('admin@acme.com');
      await allInputs[1].fill('password123');
    }
  }

  if (passwordInput) {
    await passwordInput.fill('password123');
  }

  // Click submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('After login URL:', page.url());

  // If still on login, screenshot to debug
  if (page.url().includes('login')) {
    await page.screenshot({ path: 'screenshots/login-debug.png', fullPage: true });
    console.log('Still on login page - saved debug screenshot');

    // Check for errors on page
    const errorText = await page.textContent('body');
    const lines = errorText.split('\n').filter(l => l.trim()).slice(0, 20);
    console.log('Page text:', lines.join(' | '));
  }

  // Navigate to settings
  await page.goto('http://localhost:3002/settings');
  await page.waitForTimeout(3000);
  console.log('Settings URL:', page.url());

  // Take screenshot
  await page.screenshot({ path: 'screenshots/settings-page.png', fullPage: true });
  console.log('Screenshot saved to screenshots/settings-page.png');

  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
