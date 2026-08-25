import { expect, test } from "@playwright/test";
import { VIEWPORTS, findNestedInteractives, hasHorizontalOverflow } from "./helpers";

/**
 * The dashboard sits behind a session cookie, so what can be checked without
 * credentials is the login screen and the redirect that guards the rest.
 * Set E2E_DASHBOARD_EMAIL / E2E_DASHBOARD_PASSWORD to extend this suite over
 * the authenticated pages.
 */
const email = process.env.E2E_DASHBOARD_EMAIL;
const password = process.env.E2E_DASHBOARD_PASSWORD;

test("authenticated dashboard routes redirect to login", async ({ page }) => {
  const res = await page.goto("/dashboard/products");
  expect(res?.status()).toBeLessThan(400);
  expect(page.url()).toContain("/dashboard/login");
});

test("login screen has no nested interactive elements", async ({ page }) => {
  await page.goto("/dashboard/login");
  const nested = (await findNestedInteractives(page)).filter((n) => n.outer.split(".")[0] !== "LABEL");
  expect(nested, JSON.stringify(nested, null, 1)).toEqual([]);
});

test("login inputs are labelled and tall enough to tap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/login");

  for (const input of await page.locator('input:not([type="checkbox"]):not([type="hidden"])').all()) {
    const box = await input.boundingBox();
    expect(box!.height, "input shorter than a comfortable tap").toBeGreaterThanOrEqual(40);

    const named = await input.evaluate((el: HTMLInputElement) => {
      const byFor = el.id ? !!document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : false;
      return byFor || !!el.closest("label") || !!el.getAttribute("aria-label") || !!el.getAttribute("aria-labelledby");
    });
    expect(named, "input has no accessible name").toBe(true);
  }
});

for (const width of VIEWPORTS) {
  test(`login screen fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard/login");
    const { overflows, scrollWidth, clientWidth } = await hasHorizontalOverflow(page);
    expect(overflows, `${scrollWidth} > ${clientWidth}`).toBe(false);
  });
}

test.describe("authenticated dashboard", () => {
  test.skip(!email || !password, "set E2E_DASHBOARD_EMAIL / E2E_DASHBOARD_PASSWORD to run");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/login");
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/mot de passe/i).fill(password!);
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();
    await page.waitForURL("**/dashboard**");
  });

  for (const route of ["/dashboard", "/dashboard/orders", "/dashboard/products", "/dashboard/inventory", "/dashboard/notifications"]) {
    test(`no nested interactive elements on ${route}`, async ({ page }) => {
      await page.goto(route);
      const nested = (await findNestedInteractives(page)).filter((n) => n.outer.split(".")[0] !== "LABEL");
      expect(nested, JSON.stringify(nested, null, 1)).toEqual([]);
    });
  }
});
