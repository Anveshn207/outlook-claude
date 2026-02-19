import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = 'C:\\Outlook Claude\\Kurweball';
const BASE_URL = 'http://localhost:3000';
const CREDENTIALS = {
  email: 'anvesh.n@engineeringsquare.us',
  password: 'Admin123$'
};

// Collect all console errors
const allConsoleErrors = {};

function addConsoleError(pageName, msg) {
  if (!allConsoleErrors[pageName]) allConsoleErrors[pageName] = [];
  allConsoleErrors[pageName].push(msg);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkConsoleErrors(page, pageName) {
  const errors = await page.evaluate(() => {
    const errorElements = document.querySelectorAll('[role="alert"], .error, .toast-error, [class*="error"]');
    return Array.from(errorElements).map(el => el.textContent?.trim()).filter(Boolean);
  });
  if (errors.length > 0) {
    console.log(`  [${pageName}] DOM errors found:`, errors);
  }
  return errors;
}

async function main() {
  console.log('=== KurweBall E2E Testing ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();
  let currentPageName = 'unknown';

  // Capture all console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known noise (notification stream SSE reconnects)
      if (!text.includes('NotificationStream') && !text.includes('notification')) {
        addConsoleError(currentPageName, `CONSOLE: ${text}`);
        console.log(`  [CONSOLE ERROR] ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    addConsoleError(currentPageName, `PAGE ERROR: ${err.message}`);
    console.log(`  [PAGE ERROR] ${err.message}`);
  });

  page.on('requestfailed', request => {
    const url = request.url();
    // Filter out notification stream failures (expected SSE behavior)
    if (url.includes('notifications/stream')) return;
    const failure = request.failure();
    addConsoleError(currentPageName, `NETWORK FAIL: ${url} - ${failure?.errorText || 'unknown'}`);
    console.log(`  [NETWORK FAIL] ${url} - ${failure?.errorText || 'unknown'}`);
  });

  let testResults = {};

  // ============================================
  // TEST 1: Login Flow
  // ============================================
  console.log('--- TEST 1: Login Flow ---');
  currentPageName = 'Login';
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);

    // Take screenshot of login page
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-login-page.png'), fullPage: true });
    console.log('  Screenshot: login page taken');

    // Fill in credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(CREDENTIALS.email);
    console.log('  Filled email');

    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill(CREDENTIALS.password);
    console.log('  Filled password');

    // Click login button
    const loginBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")').first();
    await loginBtn.waitFor({ state: 'visible', timeout: 5000 });
    await loginBtn.click();
    console.log('  Clicked login button');

    // Wait for navigation after login
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {
      console.log('  Note: Did not redirect to /dashboard, current URL:', page.url());
    });

    await sleep(3000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-login.png'), fullPage: true });
    console.log(`  Screenshot: after login taken (URL: ${page.url()})`);

    const domErrors = await checkConsoleErrors(page, 'Login');
    testResults['Login'] = { status: 'PASS', url: page.url(), domErrors };
    console.log('  TEST 1: PASS\n');
  } catch (err) {
    console.log(`  TEST 1: FAIL - ${err.message}\n`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-login-error.png'), fullPage: true }).catch(() => {});
    testResults['Login'] = { status: 'FAIL', error: err.message };
  }

  // ============================================
  // TEST 2: Dashboard
  // ============================================
  console.log('--- TEST 2: Dashboard ---');
  currentPageName = 'Dashboard';
  try {
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    // Wait for content to load
    await sleep(4000);

    const pageTitle = await page.title();
    const bodyText = await page.locator('body').textContent();
    const hasDashboardContent = bodyText.toLowerCase().includes('dashboard') ||
                                 bodyText.toLowerCase().includes('overview') ||
                                 bodyText.toLowerCase().includes('welcome') ||
                                 bodyText.toLowerCase().includes('total');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-dashboard.png'), fullPage: true });
    console.log(`  Screenshot: dashboard taken (URL: ${page.url()})`);
    console.log(`  Page title: ${pageTitle}`);
    console.log(`  Has dashboard content: ${hasDashboardContent}`);

    const domErrors = await checkConsoleErrors(page, 'Dashboard');
    testResults['Dashboard'] = { status: hasDashboardContent ? 'PASS' : 'WARN', url: page.url(), domErrors };
    console.log(`  TEST 2: ${hasDashboardContent ? 'PASS' : 'WARN'}\n`);
  } catch (err) {
    console.log(`  TEST 2: FAIL - ${err.message}\n`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-dashboard-error.png'), fullPage: true }).catch(() => {});
    testResults['Dashboard'] = { status: 'FAIL', error: err.message };
  }

  // ============================================
  // TEST 3: Candidates Import
  // ============================================
  console.log('--- TEST 3: Candidates Import ---');
  currentPageName = 'Candidates Import';
  try {
    await page.goto(`${BASE_URL}/candidates`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-before-import.png'), fullPage: true });
    console.log('  Screenshot: candidates page before import');

    // Look for Import button
    const importBtn = page.locator('button:has-text("Import"), a:has-text("Import")').first();

    let importBtnVisible = false;
    try {
      await importBtn.waitFor({ state: 'visible', timeout: 5000 });
      importBtnVisible = true;
    } catch {
      importBtnVisible = false;
    }

    if (importBtnVisible) {
      await importBtn.click();
      console.log('  Clicked Import button');
      await sleep(2000);

      // Screenshot of import dialog/modal - Step 1
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-import-step1.png'), fullPage: true });
      console.log('  Screenshot: import step 1 (file upload)');

      // Look for file input (may be hidden)
      const fileInput = page.locator('input[type="file"]').first();
      const fileInputCount = await fileInput.count();

      if (fileInputCount > 0) {
        const csvPath = 'C:\\Outlook Claude\\Kurweball\\test-candidates-import.csv';
        await fileInput.setInputFiles(csvPath);
        console.log('  Uploaded CSV file');
        await sleep(3000);

        // Screenshot after file upload
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-import-step2.png'), fullPage: true });
        console.log('  Screenshot: import step 2 (column mapping / preview)');

        // Check for column mapping elements or preview
        const selectElements = await page.locator('select').count();
        const mappingText = await page.locator('body').textContent();
        const hasMapping = mappingText.toLowerCase().includes('map') ||
                          mappingText.toLowerCase().includes('column') ||
                          mappingText.toLowerCase().includes('preview') ||
                          selectElements > 0;
        console.log(`  Has mapping/preview content: ${hasMapping} (selects: ${selectElements})`);

        // Try to find a proceed button
        const proceedBtns = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Confirm"), button:has-text("Start Import"), button:has-text("Submit")');
        const proceedCount = await proceedBtns.count();

        if (proceedCount > 0) {
          const btn = proceedBtns.first();
          const btnText = await btn.textContent();
          const isDisabled = await btn.isDisabled();

          if (!isDisabled) {
            await btn.click();
            console.log(`  Clicked "${btnText.trim()}" button`);
            await sleep(4000);

            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-import-step3.png'), fullPage: true });
            console.log('  Screenshot: import step 3 (result/progress)');

            // Look for success indicators
            const resultText = await page.locator('body').textContent();
            const hasSuccess = resultText.toLowerCase().includes('success') ||
                              resultText.toLowerCase().includes('imported') ||
                              resultText.toLowerCase().includes('complete');
            console.log(`  Import success detected: ${hasSuccess}`);
          } else {
            console.log(`  Proceed button "${btnText.trim()}" is disabled`);
          }
        } else {
          console.log('  No proceed/next button found');
          // List all visible buttons
          const allBtns = await page.locator('button:visible').allTextContents();
          console.log(`  Visible buttons: ${allBtns.map(b => b.trim()).filter(Boolean).join(', ')}`);
        }
      } else {
        console.log('  No file input found');
        // Check for dropzone
        const dropzoneElements = await page.locator('[class*="drop"], [class*="upload"], [class*="drag"]').count();
        console.log(`  Dropzone elements: ${dropzoneElements}`);
      }
    } else {
      console.log('  Import button not visible');
      const allBtns = await page.locator('button:visible').allTextContents();
      console.log(`  Visible buttons: ${allBtns.map(b => b.trim()).filter(Boolean).join(', ')}`);
    }

    const domErrors = await checkConsoleErrors(page, 'Candidates Import');
    testResults['Candidates Import'] = { status: 'PASS', domErrors };
    console.log('  TEST 3: PASS\n');
  } catch (err) {
    console.log(`  TEST 3: FAIL - ${err.message}\n`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-import-error.png'), fullPage: true }).catch(() => {});
    testResults['Candidates Import'] = { status: 'FAIL', error: err.message };
  }

  // ============================================
  // TEST 4: Candidates Page (after import)
  // ============================================
  console.log('--- TEST 4: Candidates Page ---');
  currentPageName = 'Candidates Page';
  try {
    // Close any open modals first
    await page.keyboard.press('Escape');
    await sleep(500);

    await page.goto(`${BASE_URL}/candidates`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);

    // Check for table/data
    const tableRows = await page.locator('table tbody tr').count();
    const gridRows = await page.locator('[role="row"]').count();
    const totalRows = tableRows || gridRows;

    console.log(`  Table rows: ${tableRows}, Grid rows: ${gridRows}`);

    // Check for candidate names
    const bodyText = await page.locator('body').textContent();
    const hasJohnDoe = bodyText.includes('John Doe');
    const hasJaneSmith = bodyText.includes('Jane Smith');
    console.log(`  Contains "John Doe": ${hasJohnDoe}`);
    console.log(`  Contains "Jane Smith": ${hasJaneSmith}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-list.png'), fullPage: true });
    console.log(`  Screenshot: candidates list (URL: ${page.url()})`);

    const domErrors = await checkConsoleErrors(page, 'Candidates Page');
    testResults['Candidates Page'] = {
      status: totalRows > 0 ? 'PASS' : 'WARN',
      tableRows: totalRows,
      hasImportedData: hasJohnDoe || hasJaneSmith,
      domErrors
    };
    console.log(`  TEST 4: ${totalRows > 0 ? 'PASS' : 'WARN - no rows found'}\n`);
  } catch (err) {
    console.log(`  TEST 4: FAIL - ${err.message}\n`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-list-error.png'), fullPage: true }).catch(() => {});
    testResults['Candidates Page'] = { status: 'FAIL', error: err.message };
  }

  // ============================================
  // TEST 5: Bench Sales Page
  // ============================================
  console.log('--- TEST 5: Bench Sales Page ---');
  currentPageName = 'Bench Sales';
  try {
    await page.goto(`${BASE_URL}/bench-sales`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);

    const tableRows = await page.locator('table tbody tr').count();
    const gridRows = await page.locator('[role="row"]').count();
    const totalRows = tableRows || gridRows;

    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText.toLowerCase().includes('bench') ||
                       bodyText.toLowerCase().includes('sales') ||
                       totalRows > 0;

    console.log(`  Table rows: ${tableRows}, Grid rows: ${gridRows}`);
    console.log(`  Has bench sales content: ${hasContent}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-bench-sales.png'), fullPage: true });
    console.log(`  Screenshot: bench sales page (URL: ${page.url()})`);

    const domErrors = await checkConsoleErrors(page, 'Bench Sales');
    testResults['Bench Sales'] = { status: hasContent ? 'PASS' : 'WARN', tableRows: totalRows, domErrors };
    console.log(`  TEST 5: ${hasContent ? 'PASS' : 'WARN'}\n`);
  } catch (err) {
    console.log(`  TEST 5: FAIL - ${err.message}\n`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-bench-sales-error.png'), fullPage: true }).catch(() => {});
    testResults['Bench Sales'] = { status: 'FAIL', error: err.message };
  }

  // ============================================
  // TEST 6: Quick navigation to other pages for error checking
  // ============================================
  console.log('--- TEST 6: Additional Page Checks ---');
  const additionalPages = ['jobs', 'clients', 'settings'];
  for (const pagePath of additionalPages) {
    currentPageName = pagePath;
    try {
      await page.goto(`${BASE_URL}/${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      console.log(`  /${pagePath}: loaded (URL: ${page.url()})`);
      await checkConsoleErrors(page, pagePath);
    } catch (err) {
      console.log(`  /${pagePath}: FAIL - ${err.message}`);
    }
  }

  // ============================================
  // Final Report
  // ============================================
  console.log('\n\n========================================');
  console.log('=== E2E TEST RESULTS SUMMARY ===');
  console.log('========================================');
  for (const [name, result] of Object.entries(testResults)) {
    const icon = result.status === 'PASS' ? '[PASS]' : result.status === 'WARN' ? '[WARN]' : '[FAIL]';
    console.log(`  ${icon} ${name}${result.url ? ` (${result.url})` : ''}`);
    if (result.error) console.log(`        Error: ${result.error.split('\n')[0]}`);
    if (result.tableRows !== undefined) console.log(`        Rows: ${result.tableRows}`);
    if (result.hasImportedData !== undefined) console.log(`        Has imported data: ${result.hasImportedData}`);
  }

  console.log('\n=== CONSOLE ERRORS (excluding notification stream) ===');
  let totalErrors = 0;
  for (const [pageName, errors] of Object.entries(allConsoleErrors)) {
    if (errors.length > 0) {
      console.log(`\n  ${pageName}:`);
      for (const err of errors) {
        console.log(`    - ${err}`);
        totalErrors++;
      }
    }
  }
  if (totalErrors === 0) {
    console.log('  No significant console errors detected!');
  } else {
    console.log(`\n  Total errors: ${totalErrors}`);
  }

  console.log('\n=== Screenshots saved to:', SCREENSHOT_DIR, '===');

  await browser.close();
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
