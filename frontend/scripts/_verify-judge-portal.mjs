/**
 * Browser verification for Judge Portal scoring flow + API network calls.
 * Run: node scripts/_verify-judge-portal.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const LECTURER_EMAIL = process.env.E2E_LECTURER_EMAIL ?? "lecturer1@fpt.edu.vn";
const LECTURER_PASSWORD = process.env.E2E_LECTURER_PASSWORD ?? "12345678";

const PAGES = [
  { path: "/lecturer", heading: "Lecturer Dashboard" },
  { path: "/lecturer/scoring", heading: "Scoring" },
  { path: "/lecturer/rounds", heading: "My Assigned Rounds" },
  { path: "/lecturer/history", heading: "Score History" },
];

const JUDGE_API_PATTERN =
  /\/api\/(judging\/my-assignments|judging\/my-scores|rounds\/[^/]+\/(scoring\/my|criteria|submissions\/team))/;

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByLabel(/^email$/i).fill(LECTURER_EMAIL);
  await page.locator("#password").fill(LECTURER_PASSWORD);
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
    const err = req.failure()?.errorText ?? "failed";
    // React Query cancels in-flight requests on navigation (ERR_ABORTED) — not a real failure.
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

  await login(page);

  for (const { path, heading } of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    const h1 = await page.locator("h1").first().textContent().catch(() => "");
    const ok = h1?.includes(heading);
    console.log(`PAGE ${path}: ${ok ? "PASS" : "FAIL"} — h1="${h1?.trim()}"`);
    if (!ok) failedRequests.push(`PAGE ${path} — expected heading "${heading}"`);
  }

  // Open first scoring link if available
  await page.goto(`${BASE}/lecturer/scoring`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const scoreLink = page.getByRole("link", { name: /^(Score|View)$/ }).first();
  if (await scoreLink.isVisible().catch(() => false)) {
    await scoreLink.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`INTERACTION scoring detail: navigated to ${url}`);
    if (!url.includes("/lecturer/scoring/")) {
      failedRequests.push(`Scoring detail URL invalid: ${url}`);
    }
  } else {
    console.log("INTERACTION scoring detail: no Score/View link (no assignments with submissions)");
  }

  // Open first round submissions page if available
  await page.goto(`${BASE}/lecturer/rounds`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const roundLink = page.getByRole("link", { name: /View (submissions|scored)/ }).first();
  if (await roundLink.isVisible().catch(() => false)) {
    await roundLink.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    console.log(`INTERACTION round submissions: navigated to ${page.url()}`);
    const actionLink = page.getByRole("link", { name: /^(Score|View)$/ }).first();
    if (await actionLink.isVisible().catch(() => false)) {
      const href = await actionLink.getAttribute("href");
      if (href && !href.match(/\/scoring\/[^/]+\/[^/]+$/)) {
        failedRequests.push(`Round submission scoring link malformed: ${href}`);
      } else {
        console.log(`INTERACTION round submission link: ${href ?? "ok"}`);
      }
    }
  } else {
    console.log("INTERACTION round submissions: no round link available");
  }

  const judgeApis = apiCalls.filter((c) => JUDGE_API_PATTERN.test(c.url));

  await browser.close();

  const frontendConsoleErrors = consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("Download the React DevTools"),
  );

  console.log("\n--- Results ---");
  console.log(`Console errors: ${frontendConsoleErrors.length}`);
  frontendConsoleErrors.forEach((e) => console.log(`  ERR: ${e}`));
  console.log(`Failed checks: ${failedRequests.length}`);
  failedRequests.forEach((e) => console.log(`  FAIL: ${e}`));
  console.log(`Judge Portal API calls: ${judgeApis.length}`);
  judgeApis.slice(0, 20).forEach((c) => console.log(`  ${c.method} ${c.url} → ${c.status}`));

  const requiredEndpoints = [
    "/judging/my-assignments",
    "/judging/my-scores",
  ];
  for (const ep of requiredEndpoints) {
    const hit = judgeApis.some((c) => c.url.includes(ep) && c.status < 400);
    console.log(`ENDPOINT ${ep}: ${hit ? "PASS" : "MISSING"}`);
    if (!hit) failedRequests.push(`Required endpoint not called: ${ep}`);
  }

  if (frontendConsoleErrors.length > 0 || failedRequests.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
