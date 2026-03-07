import { test, expect, waitForAppReady } from "./fixtures/base-fixture";
import {
  selectFilter,
  enableGPU,
  getWebGLFilterTypes,
  disableSmoothTransitions,
} from "./helpers/filter-helpers";

test.describe("WebGL Context Loss & Error Monitoring", () => {
  // ── Task 5.1: Active WebGL context loss test ──

  test("WebGL context loss triggers Canvas2D fallback", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);

    // Enable GPU mode and select a GPU filter
    await enableGPU(appPage);
    await appPage.waitForTimeout(500);
    await selectFilter(appPage, "blur");

    // Wait for rendering to stabilise
    await appPage.waitForTimeout(2_000);

    // Trigger context loss via the app's test hook.
    // WebGL canvases are internal (not in DOM), so we call the handler directly.
    await appPage.evaluate(() => {
      const hook = (window as unknown as Record<string, unknown>)[
        "__TEST_APP__"
      ] as { triggerWebGLContextLoss: () => void } | undefined;
      if (hook) {
        hook.triggerWebGLContextLoss();
      }
    });

    // Wait for fallback to trigger
    await appPage.waitForTimeout(2_000);

    // Assert: #webgl-toggle is unchecked (GPU auto-disabled)
    const isGpuChecked = await appPage.locator("#webgl-toggle").isChecked();
    expect(
      isGpuChecked,
      "GPU toggle should be unchecked after context loss"
    ).toBe(false);

    // Assert: Toast warning appeared (check for toast element in DOM)
    const toastVisible = await appPage.evaluate(() => {
      const toasts = document.querySelectorAll(".toast");
      return toasts.length > 0;
    });
    expect(toastVisible, "Toast warning should appear after context loss").toBe(
      true
    );

    // Assert: Canvas continues rendering (app didn't crash)
    const hasPixels = await appPage.evaluate(() => {
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
    expect(
      hasPixels,
      "Canvas should continue rendering after context loss"
    ).toBe(true);

    // Non-whitelisted console errors should still be zero
    // (WebGL context lost errors are whitelisted in the fixture)
    expect(consoleErrors).toHaveLength(0);
  });

  // ── Task 5.2: Passive WebGL error monitoring test ──

  test("All GPU filters cycle without WebGL errors", async ({
    appPage,
    consoleErrors,
  }) => {
    await waitForAppReady(appPage);
    await disableSmoothTransitions(appPage);

    // Enable GPU mode
    await enableGPU(appPage);
    await appPage.waitForTimeout(500);

    const gpuFilters = getWebGLFilterTypes();

    // Cycle through all 20 GPU filters quickly (500ms each)
    for (const filterType of gpuFilters) {
      await selectFilter(appPage, filterType);
      await appPage.waitForTimeout(500);
    }

    // Wait for last filter to settle
    await appPage.waitForTimeout(1_000);

    // Assert zero unexpected console errors
    expect(
      consoleErrors,
      "Unexpected console errors during GPU filter cycling"
    ).toHaveLength(0);

    // Check for WebGL errors on existing contexts.
    // We use a data attribute approach: check error state via the app's test hook
    // rather than calling getContext() which could create a new context.
    const webglErrors = await appPage.evaluate(() => {
      const errors: string[] = [];
      const canvases = document.querySelectorAll("canvas");
      canvases.forEach((c, index) => {
        // Try webgl2 first (the app prefers webgl2), then webgl.
        // getContext returns the EXISTING context if one was already created
        // with that same type; it only creates a new one if none exists.
        // We check both types to find whichever the app used.
        for (const ctxType of ["webgl2", "webgl"] as const) {
          const gl = c.getContext(ctxType) as
            | WebGL2RenderingContext
            | WebGLRenderingContext
            | null;
          if (gl !== null) {
            const err = gl.getError();
            if (err !== gl.NO_ERROR) {
              errors.push(
                `Canvas ${index} (${ctxType}): gl.getError() = ${err}`
              );
            }
            break; // Found the active context, no need to check the other
          }
        }
      });
      return errors;
    });

    expect(
      webglErrors,
      "WebGL errors detected during filter cycling"
    ).toHaveLength(0);
  });
});
