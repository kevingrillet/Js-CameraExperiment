import { test, expect, waitForAppReady } from "./fixtures/base-fixture";
import {
  selectFilter,
  getWebGLFilterTypes,
  enableGPU,
  selectPreset,
  getFilterStack,
  setFilterStack,
  disableSmoothTransitions,
  assertCanvasRendering,
} from "./helpers/filter-helpers";

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

  // ── AC-17: GPU 5-filter stack test ──

  test("GPU 5-filter stack renders without errors", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);
    await enableGPU(appPage);
    await appPage.waitForTimeout(500);

    // Build a 5-filter GPU stack programmatically (max allowed by RenderPipeline)
    const fiveFilters = ["crt", "nightvision", "thermal", "pixelate", "invert"];
    await setFilterStack(appPage, fiveFilters);
    await appPage.waitForTimeout(3_000);

    // Verify stack depth
    const stack = await getFilterStack(appPage);
    expect(stack, "Filter stack should contain exactly 5 filters").toHaveLength(
      5
    );
    expect(stack).toEqual(fiveFilters);

    expect(consoleErrors).toHaveLength(0);
    await assertCanvasRendering(appPage, "GPU 5-filter stack");
  });
});
