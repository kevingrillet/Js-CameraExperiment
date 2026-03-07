import { test, expect, waitForAppReady } from "./fixtures/base-fixture";
import {
  selectFilter,
  getFilterTypes,
  getWebGLFilterTypes,
  enableGPU,
  disableSmoothTransitions,
} from "./helpers/filter-helpers";
import { forceGC, getHeapUsage } from "./helpers/memory-helpers";

const MB = 1024 * 1024;

test.describe("Memory Leak Detection", () => {
  // Memory tests need extra time: 3 cycles × 21 filters × 1s = 63s minimum
  test.describe.configure({ timeout: 180_000 });

  // ── Task 6.1: CPU filter cycling memory test ──

  test("CPU filter cycling does not leak memory", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);

    const filters = getFilterTypes();
    const heapAfterCycles: number[] = [];

    // Run 3 full cycles through all CPU filters
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const filterType of filters) {
        await selectFilter(appPage, filterType);
        await appPage.waitForTimeout(1_000);
      }

      // Force GC and measure heap after each cycle
      await forceGC(appPage);
      const heap = await getHeapUsage(appPage);
      heapAfterCycles.push(heap);
    }

    // Compare cycle 2 vs cycle 3 — steady-state growth should be < 10MB
    const cycle2Heap = heapAfterCycles[1]!;
    const cycle3Heap = heapAfterCycles[2]!;
    const growth = cycle3Heap - cycle2Heap;

    await test.info().attach("CPU Memory Measurements", {
      body:
        `Cycle 1: ${(heapAfterCycles[0]! / MB).toFixed(2)} MB\n` +
        `Cycle 2: ${(cycle2Heap / MB).toFixed(2)} MB\n` +
        `Cycle 3: ${(cycle3Heap / MB).toFixed(2)} MB\n` +
        `Growth (2→3): ${(growth / MB).toFixed(2)} MB`,
      contentType: "text/plain",
    });

    expect(
      growth,
      `Heap grew ${(growth / MB).toFixed(2)} MB between cycle 2 and 3 (limit: 10 MB)`
    ).toBeLessThan(10 * MB);

    // No console errors during intensive filter cycling
    expect(
      consoleErrors,
      "Console errors during CPU filter cycling"
    ).toHaveLength(0);
  });

  // ── Task 6.2: GPU filter cycling memory test ──

  test("GPU filter cycling does not leak memory", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);
    await enableGPU(appPage);
    await appPage.waitForTimeout(500);

    const gpuFilters = getWebGLFilterTypes();
    const heapAfterCycles: number[] = [];

    for (let cycle = 0; cycle < 3; cycle++) {
      for (const filterType of gpuFilters) {
        await selectFilter(appPage, filterType);
        await appPage.waitForTimeout(1_000);
      }

      await forceGC(appPage);
      const heap = await getHeapUsage(appPage);
      heapAfterCycles.push(heap);
    }

    const cycle2Heap = heapAfterCycles[1]!;
    const cycle3Heap = heapAfterCycles[2]!;
    const growth = cycle3Heap - cycle2Heap;

    await test.info().attach("GPU Memory Measurements", {
      body:
        `Cycle 1: ${(heapAfterCycles[0]! / MB).toFixed(2)} MB\n` +
        `Cycle 2: ${(cycle2Heap / MB).toFixed(2)} MB\n` +
        `Cycle 3: ${(cycle3Heap / MB).toFixed(2)} MB\n` +
        `Growth (2→3): ${(growth / MB).toFixed(2)} MB`,
      contentType: "text/plain",
    });

    expect(
      growth,
      `GPU heap grew ${(growth / MB).toFixed(2)} MB between cycle 2 and 3 (limit: 10 MB)`
    ).toBeLessThan(10 * MB);

    // No console errors during intensive GPU filter cycling
    expect(
      consoleErrors,
      "Console errors during GPU filter cycling"
    ).toHaveLength(0);
  });

  // ── Task 6.3: Sustained rendering memory test ──

  test("Sustained rendering does not leak memory", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);

    // Select a complex filter
    await selectFilter(appPage, "oilpainting");
    await appPage.waitForTimeout(2_000);

    // Measure heap at 10s intervals
    const measurements: number[] = [];

    await forceGC(appPage);
    measurements.push(await getHeapUsage(appPage));

    // Wait 10s, measure
    await appPage.waitForTimeout(10_000);
    await forceGC(appPage);
    measurements.push(await getHeapUsage(appPage));

    // Wait another 10s, measure
    await appPage.waitForTimeout(10_000);
    await forceGC(appPage);
    measurements.push(await getHeapUsage(appPage));

    // Wait final 10s, measure
    await appPage.waitForTimeout(10_000);
    await forceGC(appPage);
    measurements.push(await getHeapUsage(appPage));

    await test.info().attach("Sustained Memory Measurements", {
      body:
        `0s: ${(measurements[0]! / MB).toFixed(2)} MB\n` +
        `10s: ${(measurements[1]! / MB).toFixed(2)} MB\n` +
        `20s: ${(measurements[2]! / MB).toFixed(2)} MB\n` +
        `30s: ${(measurements[3]! / MB).toFixed(2)} MB`,
      contentType: "text/plain",
    });

    // Heap should be stable: each adjacent pair within ±2MB
    for (let i = 1; i < measurements.length; i++) {
      const delta = Math.abs(measurements[i]! - measurements[i - 1]!);
      expect(
        delta,
        `Heap changed ${(delta / MB).toFixed(2)} MB between ${(i - 1) * 10}s and ${i * 10}s (limit: 2 MB)`
      ).toBeLessThan(2 * MB);
    }

    // No console errors during sustained rendering
    expect(
      consoleErrors,
      "Console errors during sustained rendering"
    ).toHaveLength(0);
  });
});
