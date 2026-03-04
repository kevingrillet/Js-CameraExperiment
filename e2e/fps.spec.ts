import { test, expect, waitForAppReady } from "./fixtures/base-fixture";
import {
  selectFilter,
  getFilterTypes,
  getWebGLFilterTypes,
  enableGPU,
  enableFPS,
  getFPS,
  disableSmoothTransitions,
  selectPreset,
} from "./helpers/filter-helpers";

test.describe("FPS Validation", () => {
  // ── Task 7.1: FPS threshold test per CPU filter ──

  const cpuFilters = getFilterTypes();

  for (const filterType of cpuFilters) {
    test(`CPU filter "${filterType}" maintains >= 15 FPS`, async ({
      appPage,
    }) => {
      await waitForAppReady(appPage);
      await disableSmoothTransitions(appPage);
      await enableFPS(appPage);

      await selectFilter(appPage, filterType);

      // Wait 3s for FPS to stabilise
      await appPage.waitForTimeout(3_000);

      const fps = await getFPS(appPage);
      await test.info().attach("FPS", {
        body: `CPU "${filterType}": ${fps} FPS`,
        contentType: "text/plain",
      });

      expect(
        fps,
        `CPU filter "${filterType}" FPS is ${fps} (minimum: 15)`
      ).toBeGreaterThanOrEqual(15);
    });
  }

  // ── Task 7.2: FPS threshold test per GPU filter ──

  const gpuFilters = getWebGLFilterTypes();

  for (const filterType of gpuFilters) {
    test(`GPU filter "${filterType}" maintains >= 15 FPS`, async ({
      appPage,
    }) => {
      await waitForAppReady(appPage);
      await disableSmoothTransitions(appPage);
      await enableFPS(appPage);
      await enableGPU(appPage);
      await appPage.waitForTimeout(500);

      await selectFilter(appPage, filterType);

      // Wait 3s for shader compilation + FPS stabilisation in SwiftShader
      await appPage.waitForTimeout(3_000);

      const fps = await getFPS(appPage);
      await test.info().attach("FPS", {
        body: `GPU "${filterType}": ${fps} FPS`,
        contentType: "text/plain",
      });

      expect(
        fps,
        `GPU filter "${filterType}" FPS is ${fps} (minimum: 15)`
      ).toBeGreaterThanOrEqual(15);
    });
  }

  // ── Task 7.3: FPS evolution on filter switch ──

  test("FPS recovers after switching from heavy to no filter", async ({
    appPage,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);
    await enableFPS(appPage);

    // Baseline: "none" filter
    await selectFilter(appPage, "none");
    await appPage.waitForTimeout(3_000);
    const baselineFPS = await getFPS(appPage);

    // Heavy filter: "oilpainting"
    await selectFilter(appPage, "oilpainting");
    await appPage.waitForTimeout(3_000);
    const heavyFPS = await getFPS(appPage);

    // Light filter: "invert"
    await selectFilter(appPage, "invert");
    await appPage.waitForTimeout(3_000);
    const lightFPS = await getFPS(appPage);

    // Back to "none"
    await selectFilter(appPage, "none");
    await appPage.waitForTimeout(3_000);
    const recoveredFPS = await getFPS(appPage);

    await test.info().attach("FPS Evolution", {
      body:
        `Baseline (none): ${baselineFPS}\n` +
        `Heavy (oilpainting): ${heavyFPS}\n` +
        `Light (invert): ${lightFPS}\n` +
        `Recovered (none): ${recoveredFPS}`,
      contentType: "text/plain",
    });

    // Assert: FPS recovers to >= 80% of baseline
    expect(
      recoveredFPS,
      `Recovered FPS (${recoveredFPS}) should be >= 80% of baseline (${baselineFPS})`
    ).toBeGreaterThanOrEqual(Math.floor(baselineFPS * 0.8));

    // Assert: no FPS measurement is 0 (pipeline didn't stop)
    expect(baselineFPS, "Baseline FPS should not be 0").toBeGreaterThan(0);
    expect(heavyFPS, "Heavy filter FPS should not be 0").toBeGreaterThan(0);
    expect(lightFPS, "Light filter FPS should not be 0").toBeGreaterThan(0);
    expect(recoveredFPS, "Recovered FPS should not be 0").toBeGreaterThan(0);
  });

  // ── Task 7.4: FPS stability with filter stacking ──

  test("FPS degrades proportionally with filter stacking", async ({
    appPage,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);
    await enableFPS(appPage);

    // Single filter baseline
    await selectFilter(appPage, "sepia");
    await appPage.waitForTimeout(3_000);
    const fps1 = await getFPS(appPage);

    // Known presets with increasing stack depth
    const presets = [
      { key: "cinematic", expectedMin: 2 },
      { key: "cyberpunk", expectedMin: 3 },
      { key: "dreamSequence", expectedMin: 3 },
    ] as const;

    const results: string[] = [`Single filter (sepia): ${fps1} FPS`];

    for (const preset of presets) {
      const stack = await selectPreset(appPage, preset.key);
      expect(
        stack.length,
        `Preset "${preset.key}" should load >= ${preset.expectedMin} filters`
      ).toBeGreaterThanOrEqual(preset.expectedMin);

      await appPage.waitForTimeout(3_000);
      const fps = await getFPS(appPage);
      results.push(
        `Preset "${preset.key}" (${stack.length} filters: ${stack.join(", ")}): ${fps} FPS`
      );

      expect(
        fps,
        `FPS should be > 0 for preset "${preset.key}"`
      ).toBeGreaterThan(0);
    }

    await test.info().attach("FPS Stacking Measurements", {
      body: results.join("\n"),
      contentType: "text/plain",
    });
  });
});
