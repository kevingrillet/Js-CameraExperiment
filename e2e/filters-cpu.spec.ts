import { test, expect, waitForAppReady } from "./fixtures/base-fixture";
import {
  selectFilter,
  getFilterTypes,
  selectPreset,
  getFilterStack,
  setFilterStack,
  disableSmoothTransitions,
  assertCanvasRendering,
} from "./helpers/filter-helpers";

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

  // ── AC-16: CPU 5-filter stack test ──

  test("CPU 5-filter stack renders without errors", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);

    // Build a 5-filter stack programmatically (max allowed by RenderPipeline)
    const fiveFilters = ["crt", "nightvision", "thermal", "pixelate", "invert"];
    await setFilterStack(appPage, fiveFilters);
    await appPage.waitForTimeout(2_000);

    // Verify stack depth
    const stack = await getFilterStack(appPage);
    expect(stack, "Filter stack should contain exactly 5 filters").toHaveLength(
      5
    );
    expect(stack).toEqual(fiveFilters);

    expect(consoleErrors).toHaveLength(0);
    await assertCanvasRendering(appPage, "CPU 5-filter stack");
  });
});
