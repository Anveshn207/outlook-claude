import { chromium, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3000";
const API = "http://localhost:3001/api";
const SCREENSHOTS = path.join(__dirname, "e2e-screenshots");
const CREDS = { email: "anvesh.n@engineeringsquare.us", password: "Admin123$" };

interface TestResult {
  test: string;
  status: "PASS" | "FAIL" | "WARNING";
  consoleErrors: string[];
  notes: string[];
  screenshotFile: string;
  loadTimeMs: number;
}

const results: TestResult[] = [];
let consoleErrors: string[] = [];

function log(msg: string) {
  console.log(`[E2E] ${msg}`);
}

async function screenshot(page: Page, name: string) {
  const filePath = path.join(SCREENSHOTS, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

function filterErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("Download the React DevTools") &&
      !e.includes("SearchService") &&
      !e.includes("OpenSearch") &&
      !e.includes("SMTP") &&
      !e.includes("net::ERR_") && // Network errors from devtools
      !e.includes("404 (Not Found)") // favicon 404s
  );
}

async function waitForLoad(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

// ============ GENERIC PAGE TEST ============

async function testPageNav(
  page: Page,
  name: string,
  url: string,
  screenshotName: string,
  extraChecks?: (p: Page) => Promise<string[]>
): Promise<TestResult> {
  consoleErrors = [];
  const start = Date.now();
  const notes: string[] = [];

  try {
    log(`Testing: ${name} (${url})`);
    await page.goto(url, { timeout: 30000 });
    await waitForLoad(page);

    const ssFile = await screenshot(page, screenshotName);
    const loadTime = Date.now() - start;

    // Check for visible error text
    const pageText = await page.textContent("body") || "";
    if (pageText.includes("Internal Server Error") || pageText.includes("500")) {
      notes.push("VISIBLE: 500 / Internal Server Error on page");
    }
    if (pageText.includes("Something went wrong")) {
      notes.push("VISIBLE: 'Something went wrong' error on page");
    }
    if (pageText.includes("404") && pageText.includes("not found")) {
      notes.push("VISIBLE: 404 Not Found on page");
    }

    // Run extra checks
    if (extraChecks) {
      const extra = await extraChecks(page);
      notes.push(...extra);
    }

    const filtered = filterErrors(consoleErrors);
    const status: TestResult["status"] =
      filtered.length > 0 || notes.some((n) => n.startsWith("VISIBLE:")) ? "WARNING" : "PASS";

    const result: TestResult = {
      test: name,
      status,
      consoleErrors: [...filtered],
      notes,
      screenshotFile: ssFile,
      loadTimeMs: loadTime,
    };

    log(`  ${status} | ${loadTime}ms | Errors: ${filtered.length}`);
    filtered.forEach((e) => log(`  ERROR: ${e.substring(0, 150)}`));
    notes.forEach((n) => log(`  NOTE: ${n}`));

    results.push(result);
    return result;
  } catch (err: any) {
    const ssFile = await screenshot(page, `${screenshotName}-error`).catch(() => "");
    const filtered = filterErrors(consoleErrors);
    const result: TestResult = {
      test: name,
      status: "FAIL",
      consoleErrors: [...filtered, `Test error: ${err.message}`],
      notes: [`Test failed: ${err.message}`],
      screenshotFile: ssFile,
      loadTimeMs: Date.now() - start,
    };
    log(`  FAIL: ${err.message}`);
    results.push(result);
    return result;
  }
}

// ============ MAIN ============

async function main() {
  if (!fs.existsSync(SCREENSHOTS)) {
    fs.mkdirSync(SCREENSHOTS, { recursive: true });
  }

  log("=== KurweBall E2E Test Suite ===");
  log(`Frontend: ${BASE}`);
  log(`API: ${API}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Capture console errors globally
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(`PAGE_ERROR: ${err.message}`);
  });

  try {
    // ===== 1. LANDING PAGE =====
    await testPageNav(page, "1. Landing Page", BASE, "01-landing-page", async (p) => {
      const notes: string[] = [];
      const title = await p.title();
      notes.push(`Title: "${title}"`);
      const h1 = await p.locator("h1").first().textContent().catch(() => null);
      if (h1) notes.push(`Hero: "${h1.substring(0, 80)}"`);
      else notes.push("No h1 found");
      return notes;
    });

    // ===== 2. LOGIN FLOW =====
    log("\nTesting: 2. Login Flow");
    consoleErrors = [];
    const loginStart = Date.now();
    const loginNotes: string[] = [];
    let loginStatus: TestResult["status"] = "PASS";

    try {
      await page.goto(`${BASE}/login`, { timeout: 15000 });
      await waitForLoad(page);
      await screenshot(page, "02a-login-page");
      loginNotes.push("Login page loaded");

      // Fill credentials
      await page.fill('input[type="email"]', CREDS.email);
      await page.fill('input[type="password"]', CREDS.password);
      await screenshot(page, "02b-login-filled");
      loginNotes.push("Credentials filled");

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});
      await waitForLoad(page);
      await screenshot(page, "02c-login-redirect");

      const currentUrl = page.url();
      loginNotes.push(`Redirected to: ${currentUrl}`);

      if (currentUrl.includes("/login")) {
        loginStatus = "FAIL";
        loginNotes.push("LOGIN FAILED - still on login page");
        // Check for error message
        const errorMsg = await page.locator('[class*="error"], [class*="alert"], [role="alert"]').textContent().catch(() => null);
        if (errorMsg) loginNotes.push(`Error message: "${errorMsg}"`);
      } else if (currentUrl.includes("/dashboard")) {
        loginNotes.push("Successfully redirected to dashboard");
      }
    } catch (err: any) {
      loginStatus = "FAIL";
      loginNotes.push(`Login error: ${err.message}`);
      await screenshot(page, "02-login-error").catch(() => {});
    }

    const filteredLoginErrors = filterErrors(consoleErrors);
    if (filteredLoginErrors.length > 0 && loginStatus === "PASS") loginStatus = "WARNING";

    results.push({
      test: "2. Login Flow",
      status: loginStatus,
      consoleErrors: [...filteredLoginErrors],
      notes: loginNotes,
      screenshotFile: path.join(SCREENSHOTS, "02c-login-redirect.png"),
      loadTimeMs: Date.now() - loginStart,
    });
    log(`  ${loginStatus} | ${Date.now() - loginStart}ms`);
    loginNotes.forEach((n) => log(`  NOTE: ${n}`));

    // ===== 3. DASHBOARD =====
    await testPageNav(page, "3. Dashboard", `${BASE}/dashboard`, "03-dashboard", async (p) => {
      const notes: string[] = [];
      const cards = await p.locator('[class*="card"]').count();
      notes.push(`Card elements: ${cards}`);
      const headings = await p.locator("h1, h2, h3").allTextContents();
      notes.push(`Headings: ${headings.slice(0, 5).join(", ")}`);
      return notes;
    });

    // ===== 4. CANDIDATES =====
    await testPageNav(page, "4. Candidates", `${BASE}/candidates`, "04-candidates", async (p) => {
      const notes: string[] = [];
      const tableRows = await p.locator("table tbody tr").count();
      notes.push(`Table rows: ${tableRows}`);
      const tables = await p.locator("table").count();
      notes.push(`Tables: ${tables}`);
      return notes;
    });

    // ===== 5. JOBS =====
    await testPageNav(page, "5. Jobs", `${BASE}/jobs`, "05-jobs", async (p) => {
      const notes: string[] = [];
      const tableRows = await p.locator("table tbody tr").count();
      notes.push(`Table rows: ${tableRows}`);
      return notes;
    });

    // ===== 6. CLIENTS =====
    await testPageNav(page, "6. Clients", `${BASE}/clients`, "06-clients", async (p) => {
      const notes: string[] = [];
      const tableRows = await p.locator("table tbody tr").count();
      notes.push(`Table rows: ${tableRows}`);
      return notes;
    });

    // ===== 7. PIPELINE =====
    await testPageNav(page, "7. Pipeline", `${BASE}/pipeline`, "07-pipeline", async (p) => {
      const notes: string[] = [];
      const columns = await p.locator('[class*="column"], [class*="kanban"], [class*="lane"], [class*="stage"]').count();
      notes.push(`Kanban column elements: ${columns}`);
      const cards = await p.locator('[class*="card"]').count();
      notes.push(`Card elements: ${cards}`);
      return notes;
    });

    // ===== 8. TEAM =====
    await testPageNav(page, "8. Team", `${BASE}/team`, "08-team", async (p) => {
      const notes: string[] = [];
      const tableRows = await p.locator("table tbody tr").count();
      notes.push(`Table rows: ${tableRows}`);
      const inviteElements = await p.locator('text=/invite|Invite|pending|Pending/').count();
      notes.push(`Invite/pending text elements: ${inviteElements}`);
      return notes;
    });

    // ===== 9. ACCOUNT =====
    await testPageNav(page, "9. Account", `${BASE}/account`, "09-account", async (p) => {
      const notes: string[] = [];
      const inputs = await p.locator("input").count();
      notes.push(`Input fields: ${inputs}`);
      const avatars = await p.locator('[class*="avatar"]').count();
      notes.push(`Avatar elements: ${avatars}`);
      return notes;
    });

    // ===== 10. SETTINGS =====
    await testPageNav(page, "10. Settings", `${BASE}/settings`, "10-settings", async (p) => {
      const notes: string[] = [];
      const headings = await p.locator("h2, h3").allTextContents();
      notes.push(`Section headings: ${headings.join(", ")}`);
      return notes;
    });

    // ===== 11. REPORTS =====
    await testPageNav(page, "11. Reports", `${BASE}/reports`, "11-reports", async (p) => {
      const notes: string[] = [];
      const charts = await p.locator('canvas, svg, [class*="chart"], [class*="graph"]').count();
      notes.push(`Chart/graph elements: ${charts}`);
      return notes;
    });

    // ===== 12. SEARCH =====
    await testPageNav(page, "12. Search", `${BASE}/search`, "12-search", async (p) => {
      const notes: string[] = [];
      const searchInputs = await p.locator('input[type="search"], input[placeholder*="search" i], input[type="text"]').count();
      notes.push(`Search inputs: ${searchInputs}`);
      return notes;
    });

    // ===== 13. CALENDAR =====
    await testPageNav(page, "13. Calendar", `${BASE}/calendar`, "13-calendar", async (p) => {
      const notes: string[] = [];
      const calElements = await p.locator('[class*="calendar"], [class*="Calendar"], table').count();
      notes.push(`Calendar elements: ${calElements}`);
      return notes;
    });

    // ===== 14. NOTIFICATIONS =====
    log("\nTesting: 14. Notifications");
    consoleErrors = [];
    const notifNotes: string[] = [];
    let notifStatus: TestResult["status"] = "PASS";

    try {
      await page.goto(`${BASE}/dashboard`, { timeout: 15000 });
      await waitForLoad(page);

      // Look for notification bell - try various selectors
      const bellSelectors = [
        'button[aria-label*="notification" i]',
        'button:has(svg[class*="bell"])',
        '[class*="notification"] button',
        'button:has([data-lucide="bell"])',
        'nav button:nth-last-child(1)',
        'nav button:nth-last-child(2)',
        'nav button:nth-last-child(3)',
      ];

      let bellFound = false;
      for (const selector of bellSelectors) {
        const el = page.locator(selector).first();
        const visible = await el.isVisible().catch(() => false);
        if (visible) {
          notifNotes.push(`Bell found with: ${selector}`);
          await el.click();
          await page.waitForTimeout(1500);
          await screenshot(page, "14-notifications-open");
          bellFound = true;

          // Check for dropdown/popover
          const dropdownCount = await page.locator('[class*="dropdown"], [class*="popover"], [role="menu"], [role="dialog"], [class*="notification"]').count();
          notifNotes.push(`Dropdown/popover elements: ${dropdownCount}`);
          break;
        }
      }

      if (!bellFound) {
        notifNotes.push("No notification bell found with common selectors");
        await screenshot(page, "14-notifications-no-bell");
        notifStatus = "WARNING";
      }
    } catch (err: any) {
      notifStatus = "FAIL";
      notifNotes.push(`Error: ${err.message}`);
      await screenshot(page, "14-notifications-error").catch(() => {});
    }

    const filteredNotifErrors = filterErrors(consoleErrors);
    if (filteredNotifErrors.length > 0 && notifStatus === "PASS") notifStatus = "WARNING";

    results.push({
      test: "14. Notifications",
      status: notifStatus,
      consoleErrors: [...filteredNotifErrors],
      notes: notifNotes,
      screenshotFile: path.join(SCREENSHOTS, "14-notifications-open.png"),
      loadTimeMs: 0,
    });
    log(`  ${notifStatus}`);
    notifNotes.forEach((n) => log(`  NOTE: ${n}`));

  } finally {
    await browser.close();
  }

  // ===== SUMMARY =====
  log("\n\n========================================");
  log("       E2E TEST RESULTS SUMMARY");
  log("========================================\n");

  const passed = results.filter((r) => r.status === "PASS");
  const warnings = results.filter((r) => r.status === "WARNING");
  const failed = results.filter((r) => r.status === "FAIL");

  log(`PASSED:   ${passed.length}/${results.length}`);
  log(`WARNINGS: ${warnings.length}/${results.length}`);
  log(`FAILED:   ${failed.length}/${results.length}\n`);

  for (const r of results) {
    const tag = r.status === "PASS" ? "[PASS]" : r.status === "WARNING" ? "[WARN]" : "[FAIL]";
    log(`${tag} ${r.test}`);
    log(`     Load: ${r.loadTimeMs}ms | Console Errors: ${r.consoleErrors.length}`);
    if (r.consoleErrors.length > 0) {
      r.consoleErrors.forEach((e) => log(`     CONSOLE ERROR: ${e.substring(0, 200)}`));
    }
    if (r.notes.length > 0) {
      r.notes.forEach((n) => log(`     ${n}`));
    }
    log("");
  }

  // Save JSON report
  const reportPath = path.join(SCREENSHOTS, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`Report saved to: ${reportPath}`);
  log(`Screenshots saved to: ${SCREENSHOTS}`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("E2E test runner crashed:", e);
  process.exit(1);
});
