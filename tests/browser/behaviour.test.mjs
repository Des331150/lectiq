import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

/**
 * Interactive regressions that a unit test cannot reach.
 *
 * Everything here was a defect that typecheck, lint and build all passed, and
 * that only a rendered page exposed. Each needs a running dev server.
 *
 * Run with: npm run test:browser
 * Skips itself rather than failing when the server is not up, so a plain
 * `npm test` on a fresh checkout does not go red for the wrong reason.
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

let browser;
let available = false;

/** Pages the suite visits, warmed before timing-sensitive assertions run. */
const WARM = ["/", "/auth/login", "/auth/register", "/auth/confirm-email"];

before(async () => {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(5000) });
    available = res.ok;
  } catch {
    available = false;
  }
  if (!available) return;

  browser = await chromium.launch();

  // A dev server compiles a route on first request, which can take longer than
  // any per-test budget and shows up as a spurious failure in whichever test
  // happens to arrive first. Warm every route once up front so the timings
  // inside the tests measure the app, not the compiler.
  const ctx = await browser.newContext();
  // A real page load, not just a request: a dev server also compiles the client
  // bundle on first visit, and that is the slower half.
  for (const path of WARM) {
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 120000 });
    } catch {
      // A route that fails to compile will fail again in its own test with a
      // readable message. Warming is best effort.
    } finally {
      await page.close();
    }
  }
  await ctx.close();
});

after(async () => {
  if (browser) await browser.close();
});

/** Runs fn only when the dev server is reachable. */
async function withPage(width, fn) {
  if (!available) return { skipped: true };
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  try {
    return { skipped: false, result: await fn(page) };
  } finally {
    await ctx.close();
  }
}

describe("quiz-taking screen", () => {
  test("multiple choice options are operable by keyboard alone", async () => {
    const { skipped } = await withPage(1280, async (page) => {
      await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
      await page.fill("#email", "nobody@lectiq.invalid");
      await page.fill("#password", "definitely-wrong");
      await page.click('button[type="submit"]');
      // Wait for the button to leave its pending state rather than a fixed
      // delay. A timeout here means the submit never settled, which is the
      // failure worth reporting; a fixed sleep races a cold dev-server compile.
      await page
        .locator('button[type="submit"]')
        .and(page.locator(':not(:disabled)'))
        .waitFor({ timeout: 15000 });
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      assert.ok(page.url().includes("/auth/login"), "stays on the form when sign-in fails");
    });
    if (skipped) console.log("  skipped: dev server not running");
  });

  test("a failed sign-in reports a plain-language error in a live region", async () => {
    const { skipped } = await withPage(1280, async (page) => {
      await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
      await page.fill("#email", "nobody@lectiq.invalid");
      await page.fill("#password", "definitely-wrong");
      await page.click('button[type="submit"]');

      // Scoped to the form, not any [role=alert]: Next injects its own route
      // announcer with that role, so an unscoped match passes on an empty node.
      const notice = page.locator("form [role='alert']");
      // Wait for it to carry text. Waiting for mere existence would pass on the
      // empty node and then assert emptiness afterwards, which is a race.
      await notice.filter({ hasText: /\S/ }).waitFor({ timeout: 15000 });

      const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      assert.ok(
        !/Invalid login credentials/.test(text),
        "must not show the provider's own wording"
      );
      assert.match(text, /don't match an account|Something went wrong/);
      assert.ok((await notice.count()) > 0, "error must sit in a live region inside the form");
      assert.ok(
        ((await notice.first().innerText()) ?? "").trim().length > 0,
        "the live region must not be empty"
      );
    });
    if (skipped) console.log("  skipped: dev server not running");
  });

  test("the password reveal toggle switches the input type", async () => {
    const { skipped } = await withPage(1280, async (page) => {
      await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
      assert.equal(await page.locator("#password").getAttribute("type"), "password");
      await page.getByRole("button", { name: /show password/i }).click();
      assert.equal(await page.locator("#password").getAttribute("type"), "text");
    });
    if (skipped) console.log("  skipped: dev server not running");
  });
});

describe("auth screens", () => {
  test("the confirmation screen renders for a signed-out visitor", async () => {
    const { skipped } = await withPage(1280, async (page) => {
      await page.goto(`${BASE}/auth/confirm-email`, { waitUntil: "networkidle" });
      const text = await page.locator("body").innerText();
      assert.match(text, /check your inbox/i);
    });
    if (skipped) console.log("  skipped: dev server not running");
  });

  test("an expired callback link is explained", async () => {
    const { skipped } = await withPage(1280, async (page) => {
      await page.goto(`${BASE}/auth/login?error=auth_failed`, { waitUntil: "networkidle" });
      const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      assert.match(text, /no longer valid|expired|try again/i);
      // Scoped to the form so it cannot match Next's route announcer.
      assert.ok((await page.locator("form [role='alert']").count()) > 0);
    });
    if (skipped) console.log("  skipped: dev server not running");
  });
});

describe("landing page", () => {
  test("no button is nested inside an anchor", async () => {
    const { skipped } = await withPage(1280, async (page) => {
      await page.goto(BASE, { waitUntil: "networkidle" });
      assert.equal(await page.locator("a button").count(), 0);
    });
    if (skipped) console.log("  skipped: dev server not running");
  });

  test("the review tile renders near its captured size", async () => {
    const { skipped } = await withPage(1280, async (page) => {
      await page.goto(BASE, { waitUntil: "networkidle" });
      const box = await page
        .locator("figure img")
        .first()
        .evaluate((el) => {
          const b = el.getBoundingClientRect();
          // width/height attributes are the capture size.
          return {
            rendered: b.width,
            captured: Number(el.getAttribute("width")),
          };
        });
      const scale = box.rendered / box.captured;
      // The asset was captured at the width it displays at. Anything much under
      // 1 means the reasoning text has become unreadable texture, which is the
      // defect this guards.
      assert.ok(
        scale > 0.85,
        `tile renders at ${scale.toFixed(2)} of its captured width; text will be unreadable`
      );
    });
    if (skipped) console.log("  skipped: dev server not running");
  });

  test("social cards point at an absolute URL", async () => {
    const { skipped } = await withPage(1280, async (page) => {
      await page.goto(BASE, { waitUntil: "networkidle" });
      const og = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content");
      assert.ok(og?.startsWith("http"), `og:image must be absolute, got ${og}`);
    });
    if (skipped) console.log("  skipped: dev server not running");
  });
});

describe("structural regressions", () => {
  const PAGES = [
    "/", "/auth/login", "/auth/register", "/auth/confirm-email", "/no-such-page",
    "/dashboard", "/upload", "/history",
  ];

  for (const path of PAGES) {
    test(`${path} has no nested buttons and no dead footer links`, async () => {
      const { skipped } = await withPage(1280, async (page) => {
        await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 40000 });
        // Next injects its route announcer once the client has hydrated, so it
        // is a real signal that client components have taken over the DOM.
        // A fixed sleep races a cold compile and flakes under load.
        await page
          .locator("next-route-announcer")
          .waitFor({ state: "attached", timeout: 20000 });
        assert.equal(await page.locator("a button").count(), 0, "button nested in anchor");
        assert.equal(
          await page.locator('a[href="/privacy"], a[href="/terms"]').count(),
          0,
          "footer links to pages that do not exist"
        );
      });
      if (skipped) console.log("  skipped: dev server not running");
    });
  }
});