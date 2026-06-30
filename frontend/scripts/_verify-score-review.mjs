/**
 * Browser verification for Score Deviation Review API wiring.
 * Run: node scripts/_verify-score-review.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@seal.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "12345678";
const COORDINATOR_EMAIL = process.env.E2E_COORDINATOR_EMAIL ?? "coordinator@seal.com";
const COORDINATOR_PASSWORD = process.env.E2E_COORDINATOR_PASSWORD ?? "12345678";
const LECTURER_EMAIL = process.env.E2E_LECTURER_EMAIL ?? "lecturer1@fpt.edu.vn";
const LECTURER_PASSWORD = process.env.E2E_LECTURER_PASSWORD ?? "12345678";

const SCORE_REVIEW_API = /\/api\/events\/[^/]+\/score-reviews/;

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByLabel(/^email$/i).fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

function trackPage(page, consoleErrors, failedRequests, apiCalls) {
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    const err = req.failure()?.errorText ?? "failed";
    if (err.includes("ERR_ABORTED")) return;
    if (url.includes("/api/")) {
      failedRequests.push(`${req.method()} ${url} — ${err}`);
    }
  });
  page.on("response", (res) => {
    const url = res.url();
    if (!url.includes("/api/")) return;
    apiCalls.push({ method: res.request().method(), url, status: res.status() });
    if (res.status() >= 400) {
      failedRequests.push(`${res.request().method()} ${url} — HTTP ${res.status()}`);
    }
  });
}

async function selectFirstEvent(page) {
  const eventSelect = page.locator("select").first();
  await eventSelect.waitFor({ state: "visible", timeout: 10000 });
  const options = await eventSelect.locator("option").all();
  for (const opt of options) {
    const value = await opt.getAttribute("value");
    if (value) {
      await eventSelect.selectOption(value);
      return value;
    }
  }
  return null;
}

async function verifyAdminVariance(page, consoleErrors, failedRequests, apiCalls) {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto(`${BASE}/admin/analytics/variance`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  const headingOk = h1?.includes("Score Deviation Review");
  console.log(`PAGE /admin/analytics/variance: ${headingOk ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
  if (!headingOk) failedRequests.push("PAGE /admin/analytics/variance — heading mismatch");

  const eventId = await selectFirstEvent(page);
  if (eventId) {
    await page.waitForTimeout(2500);
    console.log(`INTERACTION admin variance: selected event ${eventId}`);
    const listHit = apiCalls.some(
      (c) => c.method === "GET" && SCORE_REVIEW_API.test(c.url) && !c.url.includes("/score-reviews/") && c.status < 400,
    );
    console.log(`ENDPOINT GET /events/{id}/score-reviews: ${listHit ? "PASS" : "MISSING"}`);
    if (!listHit) failedRequests.push("GET /events/{id}/score-reviews not called after event select");

    const detailsBtn = page.getByRole("button", { name: /^Details$/ }).first();
    if (await detailsBtn.isVisible().catch(() => false)) {
      await detailsBtn.click();
      await page.waitForTimeout(2000);
      const detailHit = apiCalls.some(
        (c) => c.method === "GET" && /\/score-reviews\/[^/?]+$/.test(c.url) && c.status < 400,
      );
      console.log(`ENDPOINT GET /events/{id}/score-reviews/{reviewId}: ${detailHit ? "PASS" : "MISSING"}`);
      if (!detailHit) failedRequests.push("GET score-reviews detail not called");
      await page.getByRole("button", { name: /^Close$/ }).click().catch(() => {});
    } else {
      console.log("INTERACTION admin variance: no reviews to open detail modal");
    }
  } else {
    console.log("INTERACTION admin variance: no events in dropdown");
  }
}

async function verifyCoordinatorPage(page, consoleErrors, failedRequests, apiCalls) {
  await login(page, COORDINATOR_EMAIL, COORDINATOR_PASSWORD);
  await page.goto(`${BASE}/coordinator/score-reviews`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  const headingOk = h1?.includes("Score Deviation Review");
  console.log(`PAGE /coordinator/score-reviews: ${headingOk ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
  if (!headingOk) failedRequests.push("PAGE /coordinator/score-reviews — heading mismatch");

  const eventId = await selectFirstEvent(page);
  if (eventId) {
    await page.waitForTimeout(2000);
    const listHit = apiCalls.some(
      (c) => c.method === "GET" && SCORE_REVIEW_API.test(c.url) && c.status < 400,
    );
    console.log(`COORDINATOR list API: ${listHit ? "PASS" : "MISSING"}`);
  }
}

async function verifyJudgeAssignments(page, consoleErrors, failedRequests, apiCalls) {
  await login(page, LECTURER_EMAIL, LECTURER_PASSWORD);
  await page.goto(`${BASE}/lecturer/scoring`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  const headingOk = h1?.includes("Scoring");
  console.log(`PAGE /lecturer/scoring: ${headingOk ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
  if (!headingOk) failedRequests.push("PAGE /lecturer/scoring — heading mismatch");

  const assignmentsHit = apiCalls.some(
    (c) => c.url.includes("/judging/my-assignments") && c.status < 400,
  );
  console.log(`ENDPOINT GET /judging/my-assignments: ${assignmentsHit ? "PASS" : "MISSING"}`);
  if (!assignmentsHit) failedRequests.push("GET /judging/my-assignments not called");

  const viewDetails = page.getByRole("button", { name: /View details/i }).first();
  if (await viewDetails.isVisible().catch(() => false)) {
    await viewDetails.click();
    await page.waitForTimeout(2000);
    const detailHit = apiCalls.some(
      (c) => c.method === "GET" && /\/score-reviews\/[^/?]+$/.test(c.url) && c.status < 400,
    );
    console.log(`INTERACTION judge readonly modal: detail API ${detailHit ? "PASS" : "MISSING"}`);
    await page.getByRole("button", { name: /^Close$/ }).click().catch(() => {});
  } else {
    console.log("INTERACTION judge scoring: no open deviation flag to test readonly modal");
  }

  await page.goto(`${BASE}/lecturer/scoring`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const scoreLink = page.getByRole("link", { name: /^(Score|View)$/ }).first();
  if (await scoreLink.isVisible().catch(() => false)) {
    await scoreLink.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const requestBtn = page.getByRole("button", { name: /Request Adjustment/i });
    if (await requestBtn.isVisible().catch(() => false)) {
      console.log("INTERACTION scoring page: Request Adjustment button visible (completed submission)");
      await requestBtn.click();
      const textarea = page.locator("textarea").last();
      if (await textarea.isVisible().catch(() => false)) {
        console.log("INTERACTION scoring page: adjustment form opens PASS");
      }
    } else {
      console.log("INTERACTION scoring page: no completed submission with adjustment button");
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const consoleErrors = [];
  const failedRequests = [];
  const apiCalls = [];

  {
    const page = await browser.newPage();
    trackPage(page, consoleErrors, failedRequests, apiCalls);
    await verifyAdminVariance(page, consoleErrors, failedRequests, apiCalls);
    await page.close();
  }

  {
    const page = await browser.newPage();
    const coordErrors = [];
    const coordFailed = [];
    const coordApis = [];
    trackPage(page, coordErrors, coordFailed, coordApis);
    await verifyCoordinatorPage(page, coordErrors, coordFailed, coordApis);
    consoleErrors.push(...coordErrors);
    failedRequests.push(...coordFailed);
    apiCalls.push(...coordApis);
    await page.close();
  }

  {
    const page = await browser.newPage();
    const judgeErrors = [];
    const judgeFailed = [];
    const judgeApis = [];
    trackPage(page, judgeErrors, judgeFailed, judgeApis);
    await verifyJudgeAssignments(page, judgeErrors, judgeFailed, judgeApis);
    consoleErrors.push(...judgeErrors);
    failedRequests.push(...judgeFailed);
    apiCalls.push(...judgeApis);
    await page.close();
  }

  await browser.close();

  const frontendConsoleErrors = consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("Download the React DevTools"),
  );

  console.log("\n--- Results ---");
  console.log(`Console errors: ${frontendConsoleErrors.length}`);
  frontendConsoleErrors.forEach((e) => console.log(`  ERR: ${e}`));
  console.log(`Failed checks: ${failedRequests.length}`);
  failedRequests.forEach((e) => console.log(`  FAIL: ${e}`));

  const reviewApis = apiCalls.filter((c) => SCORE_REVIEW_API.test(c.url) || c.url.includes("/judging/my-assignments"));
  console.log(`Score Review related API calls: ${reviewApis.length}`);
  reviewApis.slice(0, 15).forEach((c) => console.log(`  ${c.method} ${c.url} → ${c.status}`));

  if (frontendConsoleErrors.length > 0 || failedRequests.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
