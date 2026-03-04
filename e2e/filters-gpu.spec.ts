import { test, expect, waitForAppReady } from "./fixtures/base-fixture";
import {
  selectFilter,
  getWebGLFilterTypes,
  enableGPU,
  selectPreset,
  getFilterStack,
  disableSmoothTransitions,
} from "./helpers/filter-helpers";

/**
 * Assert the main #canvas has non-blank pixels.
 * The main canvas (#canvas) always uses a 2D context even in GPU mode.
 * WebGL rendering happens on internal offscreen canvases; the final result
 * is composited back onto the main 2D canvas by RenderPipeline.
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

test.describe("GPU Filter Smoke Tests", () => {
  // ── Task 4.1: Individual GPU filter smoke test ──

  const gpuFilters = getWebGLFilterTypes();

  for (const filterType of gpuFilters) {
    test(`GPU filter "${filterType}" renders without errors`, async ({
      appPage,
      consoleErrors,
    }) => {
      await waitForAppReady(appPage);
      await disableSmoothTransitions(appPage);

      await enableGPU(appPage);
      await appPage.waitForTimeout(500);

      await selectFilter(appPage, filterType);
      await appPage.waitForTimeout(2_000);

      expect(
        consoleErrors,
        `console.error captured for GPU filter "${filterType}"`
      ).toHaveLength(0);

      await assertCanvasRendering(appPage, `GPU filter "${filterType}"`);
    });
  }

  // ── Task 4.2: GPU filter stack smoke tests ──

  test('GPU 2-filter stack via preset "cinematic"', async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);
    await enableGPU(appPage);
    await appPage.waitForTimeout(500);

    const stack = await selectPreset(appPage, "cinematic");
    await appPage.waitForTimeout(2_000);

    expect(stack.length, "Cinematic preset should load 2 filters").toBe(2);
    expect(consoleErrors).toHaveLength(0);
    await assertCanvasRendering(appPage, "GPU cinematic preset stack");
  });

  test('GPU 3-filter stack via preset "surveillance"', async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);
    await enableGPU(appPage);
    await appPage.waitForTimeout(500);

    const stack = await selectPreset(appPage, "surveillance");
    await appPage.waitForTimeout(2_000);

    expect(
      stack.length,
      "Surveillance preset should load 3 filters"
    ).toBeGreaterThanOrEqual(3);
    expect(consoleErrors).toHaveLength(0);
    await assertCanvasRendering(appPage, "GPU surveillance preset stack");
  });

  test("GPU multi-filter stacks via all presets", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);
    await enableGPU(appPage);
    await appPage.waitForTimeout(500);

    const presetKeys = [
      "cinematic",
      "vintageFilm",
      "cyberpunk",
      "surveillance",
      "dreamSequence",
    ];

    for (const presetKey of presetKeys) {
      const stack = await selectPreset(appPage, presetKey);
      // Allow extra time for GPU context setup/teardown between presets
      await appPage.waitForTimeout(3_000);

      expect(
        stack.length,
        `Preset "${presetKey}" should load multiple filters`
      ).toBeGreaterThanOrEqual(2);

      const currentStack = await getFilterStack(appPage);
      expect(currentStack).toEqual(stack);
    }

    expect(consoleErrors).toHaveLength(0);
    await assertCanvasRendering(appPage, "GPU preset stacks");
  });
});
