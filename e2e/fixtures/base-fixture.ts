import { test as base, type Page } from "@playwright/test";

/** Patterns that are expected and should not cause test failure */
const WHITELISTED_ERROR_PATTERNS: RegExp[] = [
  /WebGL context lost/i,
  /webglcontextlost/i,
  /WebGL not initialized/i,
  /crashed in stack.*WebGL not initialized/i,
  /crashed in stack.*drawImage/i,
];

/** Check whether an error message matches a whitelisted pattern */
function isWhitelistedError(message: string): boolean {
  return WHITELISTED_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/** Extended test fixtures providing console interception and app readiness */
export const test = base.extend<{
  consoleErrors: string[];
  consoleWarnings: string[];
  appPage: Page;
}>({
  // eslint-disable-next-line no-empty-pattern
  consoleErrors: async ({}, use) => {
    const errors: string[] = [];
    await use(errors);
  },

  // eslint-disable-next-line no-empty-pattern
  consoleWarnings: async ({}, use) => {
    const warnings: string[] = [];
    await use(warnings);
  },

  appPage: async ({ page, consoleErrors, consoleWarnings }, use, testInfo) => {
    // Attach console listeners before any navigation
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error") {
        if (!isWhitelistedError(text)) {
          consoleErrors.push(text);
        }
      }
      if (msg.type() === "warning") {
        consoleWarnings.push(text);
      }
    });

    await use(page);

    // After test: attach warnings to report for review
    if (consoleWarnings.length > 0) {
      await testInfo.attach("console-warnings", {
        body: consoleWarnings.join("\n"),
        contentType: "text/plain",
      });
    }
  },
});

export { expect } from "@playwright/test";

/**
 * Navigate to the app and wait until the canvas is rendering and stable.
 * - Waits for #canvas visible
 * - Waits for #status-message to lose .show class (app initialised)
 * - Lets 1 s of frames render so FPS stabilises
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.goto("./");

  // Wait for canvas to be visible
  await page.locator("#canvas").waitFor({ state: "visible", timeout: 15_000 });

  // Wait for status message to disappear (app finished init)
  await page
    .locator("#status-message:not(.show)")
    .waitFor({ state: "attached", timeout: 15_000 });

  // Let the rendering pipeline stabilise
  await page.waitForTimeout(1_000);
}
