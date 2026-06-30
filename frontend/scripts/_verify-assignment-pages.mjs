/**
 * Browser verification for assignment UI pages + API network calls.
 * Run: node scripts/_verify-assignment-pages.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@seal.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "12345678";

const PAGES = [
  { path: "/admin/assignments/mentors", heading: "Mentor Assignment" },
  { path: "/admin/assignments/judges", heading: "Judge Assignment" },
  { path: "/admin/assignments", heading: "Judge assignments" },
];

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByLabel(/^email$/i).fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const apiCalls = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (url.includes("/api/")) {
      failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText ?? "failed"}`);
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

  await login(page);

  for (const { path, heading } of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    const h1 = await page.locator("h1").first().textContent().catch(() => "");
    const ok = h1?.includes(heading);
    console.log(`PAGE ${path}: ${ok ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
    if (!ok) failedRequests.push(`PAGE ${path} — expected heading "${heading}"`);
  }

  // Mentor page: select first event + track to trigger tracks/mentors APIs
  await page.goto(`${BASE}/admin/assignments/mentors`, { waitUntil: "networkidle" });
  const eventSelect = page.locator("select").first();
  const eventOptions = await eventSelect.locator("option").allTextContents();
  if (eventOptions.length > 1) {
    await eventSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    const trackSelect = page.locator("select").nth(1);
    const trackOptions = await trackSelect.locator("option").allTextContents();
    if (trackOptions.length > 1) {
      await trackSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1500);
      console.log("INTERACTION mentors: selected event + track");
    }
  }

  // Judge assignments: pick Spring season and first event + round if available
  await page.goto(`${BASE}/admin/assignments`, { waitUntil: "networkidle" });
  await page.locator("select").first().selectOption("Spring");
  await page.waitForTimeout(1000);
  const eventSelect2 = page.locator("select").nth(2);
  const eventOpts2 = await eventSelect2.locator("option").allTextContents();
  if (eventOpts2.length > 1) {
    await eventSelect2.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    const roundSelect = page.locator("select").last();
    const roundOpts = await roundSelect.locator("option").allTextContents();
    if (roundOpts.length > 1) {
      await roundSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1500);
      console.log("INTERACTION team-judges: selected Spring event + round");
    }
  }

  const assignmentApis = apiCalls.filter((c) =>
    /\/api\/(admin\/users|events)/.test(c.url),
  );

  await browser.close();

  const frontendConsoleErrors = consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("Download the React DevTools"),
  );

  console.log("\n--- Results ---");
  console.log(`Console errors: ${frontendConsoleErrors.length}`);
  frontendConsoleErrors.forEach((e) => console.log(`  ERR: ${e}`));
  console.log(`Failed checks: ${failedRequests.length}`);
  failedRequests.forEach((e) => console.log(`  FAIL: ${e}`));
  console.log(`Assignment-related API calls: ${assignmentApis.length}`);
  assignmentApis.slice(0, 12).forEach((c) => console.log(`  ${c.method} ${c.url} → ${c.status}`));

  if (frontendConsoleErrors.length > 0 || failedRequests.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
