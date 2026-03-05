import { test, expect, waitForAppReady } from "./fixtures/base-fixture";
import {
  selectFilter,
  getFilterTypes,
  getWebGLFilterTypes,
  enableGPU,
  enableFPS,
  getFPS,
  setFilterStack,
  disableSmoothTransitions,
} from "./helpers/filter-helpers";

const MIN_FPS = process.env.CI ? 10 : 15;

test.describe("FPS Validation", () => {
  // ── Task 7.1: FPS threshold test per CPU filter ──

  const cpuFilters = getFilterTypes();

  for (const filterType of cpuFilters) {
    test(`CPU filter "${filterType}" maintains >= ${MIN_FPS} FPS`, async ({
      appPage,
      consoleErrors,
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
        `CPU filter "${filterType}" FPS is ${fps} (minimum: ${MIN_FPS})`
      ).toBeGreaterThanOrEqual(MIN_FPS);

      expect(consoleErrors).toHaveLength(0);
    });
  }

  // ── Task 7.2: FPS threshold test per GPU filter ──

  const gpuFilters = getWebGLFilterTypes();

  for (const filterType of gpuFilters) {
    test(`GPU filter "${filterType}" maintains >= ${MIN_FPS} FPS`, async ({
      appPage,
      consoleErrors,
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
        `GPU filter "${filterType}" FPS is ${fps} (minimum: ${MIN_FPS})`
      ).toBeGreaterThanOrEqual(MIN_FPS);

      expect(consoleErrors).toHaveLength(0);
    });
  }

  // ── Task 7.3: FPS evolution on filter switch ──

  test("FPS recovers after switching from heavy to no filter", async ({
    appPage,
    consoleErrors,
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

    expect(consoleErrors).toHaveLength(0);
  });

  // ── Task 7.4: FPS stability with filter stacking (1 to 5 filters) ──

  test("FPS degrades proportionally with filter stacking up to 5", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);
    await enableFPS(appPage);

    // Incrementally build stacks from 1 to 5 filters
    const stackFilters = ["sepia", "vignette", "chromatic", "edge", "invert"];
    const fpsValues: number[] = [];
    const results: string[] = [];

    for (let depth = 1; depth <= 5; depth++) {
      const stack = stackFilters.slice(0, depth);
      await setFilterStack(appPage, stack);
      await appPage.waitForTimeout(3_000);

      const fps = await getFPS(appPage);
      fpsValues.push(fps);
      results.push(`${depth} filter(s) [${stack.join(", ")}]: ${fps} FPS`);

      expect(
        fps,
        `FPS should be > 0 with ${depth} stacked filters`
      ).toBeGreaterThan(0);
    }

    await test.info().attach("FPS Stacking Measurements (1-5)", {
      body: results.join("\n"),
      contentType: "text/plain",
    });

    // AC-15: Verify degradation is not exponential.
    // For each step, the drop ratio (fps[i]/fps[i-1]) should not accelerate.
    // If degradation were exponential, successive ratios would decrease sharply.
    // We check: no single step drops by more than 60% of the previous value.
    for (let i = 1; i < fpsValues.length; i++) {
      if (fpsValues[i - 1]! > 0) {
        const ratio = fpsValues[i]! / fpsValues[i - 1]!;
        expect(
          ratio,
          `FPS drop from ${i} to ${i + 1} filters is too steep (ratio ${ratio.toFixed(2)}; ` +
            `${fpsValues[i - 1]} → ${fpsValues[i]} FPS). Possible O(n²) bug.`
        ).toBeGreaterThanOrEqual(0.4);
      }
    }

    expect(consoleErrors).toHaveLength(0);
  });
});
