import { test, expect, waitForAppReady } from "./fixtures/base-fixture";
import {
  selectFilter,
  getFilterTypes,
  selectPreset,
  getFilterStack,
  disableSmoothTransitions,
} from "./helpers/filter-helpers";

/**
 * Assert the main #canvas has non-blank pixels.
 * The main canvas always uses a 2D context; WebGL happens on offscreen canvases.
 */
async function assertCanvasRendering(
  page: import("@playwright/test").Page,
  label: string
): Promise<void> {
  const hasPixels = await page.evaluate(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return false;
    }
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i]! > 0 || data[i + 1]! > 0 || data[i + 2]! > 0) {
        return true;
      }
    }
    return false;
  });
  expect(hasPixels, `Canvas is blank for ${label}`).toBe(true);
}

test.describe("CPU Filter Smoke Tests", () => {
  // ── Task 3.1: Individual CPU filter smoke test ──

  const allFilters = getFilterTypes();

  for (const filterType of allFilters) {
    test(`CPU filter "${filterType}" renders without errors`, async ({
      appPage,
      consoleErrors,
    }) => {
      await waitForAppReady(appPage);
      await disableSmoothTransitions(appPage);

      await selectFilter(appPage, filterType);
      await appPage.waitForTimeout(2_000);

      expect(
        consoleErrors,
        `console.error captured for filter "${filterType}"`
      ).toHaveLength(0);

      await assertCanvasRendering(appPage, `CPU filter "${filterType}"`);
    });
  }

  // ── Task 3.2: CPU filter stack smoke tests ──

  test('CPU 2-filter stack via preset "cinematic" (dof + vignette)', async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);

    const stack = await selectPreset(appPage, "cinematic");
    await appPage.waitForTimeout(2_000);

    // Assert the preset actually loaded a multi-filter stack
    expect(stack.length, "Cinematic preset should load 2 filters").toBe(2);
    expect(consoleErrors).toHaveLength(0);
    await assertCanvasRendering(appPage, "cinematic preset stack");
  });

  test('CPU 3-filter stack via preset "cyberpunk" (glitch + chromatic + crt)', async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);

    const stack = await selectPreset(appPage, "cyberpunk");
    await appPage.waitForTimeout(2_000);

    expect(
      stack.length,
      "Cyberpunk preset should load 3 filters"
    ).toBeGreaterThanOrEqual(3);
    expect(consoleErrors).toHaveLength(0);
    await assertCanvasRendering(appPage, "cyberpunk preset stack");
  });

  test("CPU multi-filter stacks via all presets", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);

    // Test all available presets to verify multi-filter stacking
    const presetKeys = [
      "cinematic",
      "vintageFilm",
      "cyberpunk",
      "surveillance",
      "dreamSequence",
    ];

    for (const presetKey of presetKeys) {
      const stack = await selectPreset(appPage, presetKey);
      await appPage.waitForTimeout(1_500);

      // Verify the preset actually loaded multiple filters
      expect(
        stack.length,
        `Preset "${presetKey}" should load multiple filters`
      ).toBeGreaterThanOrEqual(2);

      // Verify the filter stack matches via the test hook
      const currentStack = await getFilterStack(appPage);
      expect(currentStack).toEqual(stack);
    }

    expect(consoleErrors).toHaveLength(0);
    await assertCanvasRendering(appPage, "preset stacks");
  });
});
