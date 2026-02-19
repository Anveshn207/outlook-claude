import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Outlook Claude\\Kurweball';
const BASE_URL = 'http://localhost:3000';
const CREDENTIALS = {
  email: 'anvesh.n@engineeringsquare.us',
  password: 'Admin123$'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== KurweBall Import Flow E2E Test ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('NotificationStream') && !text.includes('notification')) {
        console.log(`  [CONSOLE ERROR] ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    console.log(`  [PAGE ERROR] ${err.message}`);
  });

  // Track API responses for import
  page.on('response', response => {
    const url = response.url();
    if (url.includes('import') || url.includes('candidates')) {
      if (response.status() >= 400) {
        console.log(`  [API ERROR] ${response.status()} ${url}`);
      }
    }
  });

  // Login first
  console.log('--- Logging in ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);
  await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first().fill(CREDENTIALS.email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(CREDENTIALS.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await sleep(2000);
  console.log('  Logged in successfully\n');

  // Navigate to /import page
  console.log('--- Step 1: Navigate to Import page ---');
  await page.goto(`${BASE_URL}/import`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-import-step1.png'), fullPage: true });
  console.log('  Screenshot: Import Data page');

  // Click Import button under "Import Candidates" card
  console.log('\n--- Step 2: Click Import Candidates and upload CSV ---');
  const importCandidatesBtn = page.locator('button:has-text("Import")').first();
  await importCandidatesBtn.click();
  await sleep(2000);

  // Set file via hidden input
  const fileInput = page.locator('input[type="file"]');
  const csvPath = 'C:\\Outlook Claude\\Kurweball\\test-candidates-import.csv';
  await fileInput.first().setInputFiles(csvPath);
  await sleep(2000);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-import-step2.png'), fullPage: true });
  console.log('  Screenshot: CSV file selected');

  // Click "Upload" button
  console.log('\n--- Step 3: Click Upload ---');
  const uploadBtn = page.locator('button:has-text("Upload")').first();
  await uploadBtn.click();
  console.log('  Clicked Upload button');
  await sleep(5000);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-import-step3.png'), fullPage: true });
  console.log('  Screenshot: Preview Import (column mapping)');

  // Debug: analyze the modal structure
  const modalInfo = await page.evaluate(() => {
    // Look for modal/dialog elements
    const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="dialog"], [class*="overlay"]');
    const modalData = [];
    modals.forEach(modal => {
      const buttons = modal.querySelectorAll('button');
      const btnTexts = Array.from(buttons).map(b => ({
        text: b.textContent?.trim(),
        disabled: b.disabled,
        classes: b.className,
        rect: b.getBoundingClientRect()
      }));
      modalData.push({
        tag: modal.tagName,
        classes: modal.className?.substring?.(0, 100),
        buttonCount: buttons.length,
        buttons: btnTexts
      });
    });
    return modalData;
  });
  console.log('  Modal structure:', JSON.stringify(modalInfo, null, 2));

  // Find the Import button specifically inside the modal (not the background cards)
  // The modal should have a dialog role or be an overlay
  const modalImportBtn = page.locator('[role="dialog"] button:has-text("Import"), [class*="modal"] button:has-text("Import"), [class*="dialog"] button:has-text("Import")').first();
  let modalBtnVisible = false;
  try {
    modalBtnVisible = await modalImportBtn.isVisible({ timeout: 3000 });
  } catch { }

  if (modalBtnVisible) {
    console.log('\n--- Step 4: Click Import in modal ---');
    const btnText = await modalImportBtn.textContent();
    console.log(`  Found modal Import button: "${btnText.trim()}"`);
    await modalImportBtn.click();
    console.log('  Clicked Import');
  } else {
    // Try to find any button that's in the same container as "Preview Import" text
    console.log('  Modal Import button not found via role/class selectors');
    console.log('  Trying to find Import button near the preview content...');

    // Find all Import buttons and click the one that's inside a container with "Preview" or "Back" text
    const allImportBtns = page.locator('button:has-text("Import")');
    const count = await allImportBtns.count();
    console.log(`  Total Import buttons: ${count}`);

    for (let i = 0; i < count; i++) {
      const btn = allImportBtns.nth(i);
      const box = await btn.boundingBox();
      if (box) {
        // The modal is centered, so buttons in the modal should be roughly between x:450-1000 and y:250-600
        console.log(`  Button ${i}: position (${Math.round(box.x)}, ${Math.round(box.y)}), size ${Math.round(box.width)}x${Math.round(box.height)}`);

        // The "Back" button is at bottom-left of modal, Import should be at bottom-right
        // Modal is ~960px wide centered, so Import btn should be around x:850-960
        if (box.y > 400 && box.x > 700) {
          console.log(`  -> This looks like the modal Import button`);
          console.log('\n--- Step 4: Click Import in modal (by position) ---');
          await btn.click();
          console.log('  Clicked Import');
          break;
        }
      }
    }
  }

  await sleep(8000);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screenshot-e2e-candidates-import-step4.png'), fullPage: true });
  console.log('  Screenshot: After clicking Import');

  // Check the result
  const resultText = await page.locator('body').textContent();
  const hasSuccess = resultText.toLowerCase().includes('success') || resultText.toLowerCase().includes('imported') || resultText.toLowerCase().includes('complete');
  console.log(`  Success detected: ${hasSuccess}`);

  // If there's a "Done" or "Close" or success state, take final screenshot
  const doneBtns = page.locator('button:has-text("Done"), button:has-text("Close"), button:has-text("Finish")');
  const doneCount = await doneBtns.count();
  if (doneCount > 0) {
    console.log('  Found Done/Close button');
  }

  // List all visible buttons
  const finalBtns = await page.locator('button:visible').allTextContents();
  console.log(`  Final visible buttons: ${finalBtns.map(b => b.trim()).filter(Boolean).join(', ')}`);

  console.log('\n=== Import Test Complete ===');
  await browser.close();
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
