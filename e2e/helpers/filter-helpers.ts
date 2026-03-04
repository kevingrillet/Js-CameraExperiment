import type { Page } from "@playwright/test";

/** All 21 CPU filter types */
const ALL_FILTER_TYPES = [
  "none",
  "ascii",
  "blur",
  "chromatic",
  "comicbook",
  "crt",
  "dof",
  "edge",
  "glitch",
  "invert",
  "kaleidoscope",
  "motion",
  "nightvision",
  "oilpainting",
  "pixelate",
  "rotoscope",
  "sepia",
  "sobelrainbow",
  "thermal",
  "vhs",
  "vignette",
] as const;

/** All 20 GPU-capable filter types (excludes "none") */
const WEBGL_FILTER_TYPES = ALL_FILTER_TYPES.filter((f) => f !== "none");

export function getFilterTypes(): string[] {
  return [...ALL_FILTER_TYPES];
}

export function getWebGLFilterTypes(): string[] {
  return [...WEBGL_FILTER_TYPES];
}

/** Ensure the settings panel is open */
async function ensureSettingsOpen(page: Page): Promise<void> {
  const panel = page.locator(".settings-panel");
  const isOpen = await panel.evaluate((el) => el.classList.contains("open"));
  if (!isOpen) {
    await page.locator(".gear-button").click();
    await panel.waitFor({ state: "visible" });
  }
}

/** Select a filter type via the #filter-select dropdown */
export async function selectFilter(
  page: Page,
  filterType: string
): Promise<void> {
  await ensureSettingsOpen(page);
  await page.locator("#filter-select").selectOption(filterType);
}

/** Enable GPU (WebGL) acceleration */
export async function enableGPU(page: Page): Promise<void> {
  await ensureSettingsOpen(page);
  await page.locator("#webgl-toggle").check();
}

/** Disable GPU (WebGL) acceleration */
export async function disableGPU(page: Page): Promise<void> {
  await ensureSettingsOpen(page);
  await page.locator("#webgl-toggle").uncheck();
}

/** Enable the FPS overlay */
export async function enableFPS(page: Page): Promise<void> {
  await ensureSettingsOpen(page);
  await page.locator("#fps-toggle").check();
}

/** Disable smooth transitions to avoid crossfade timing issues */
export async function disableSmoothTransitions(page: Page): Promise<void> {
  await ensureSettingsOpen(page);
  await page.locator("#smooth-transitions-toggle").uncheck();
}

/**
 * Select a preset by its key name via the #preset-select dropdown.
 * Returns the filter stack that was loaded.
 */
export async function selectPreset(
  page: Page,
  presetKey: string
): Promise<string[]> {
  await ensureSettingsOpen(page);
  await page.locator("#preset-select").selectOption(presetKey);
  // Wait for preset to load and filters to apply
  await page.waitForTimeout(1_000);
  return getFilterStack(page);
}

/**
 * Read the current filter stack from the app's dev-only test hook.
 */
export async function getFilterStack(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const hook = (window as unknown as Record<string, unknown>)[
      "__TEST_APP__"
    ] as { getFilterStack: () => string[] } | undefined;
    if (hook === undefined) {
      throw new Error(
        "__TEST_APP__ hook not found. Ensure the app is running in dev mode."
      );
    }
    return hook.getFilterStack();
  });
}

/**
 * Read the current FPS from the app via the dev-only test hook.
 * Requires the __TEST_APP__ global set in dev mode.
 */
export async function getFPS(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const hook = (window as unknown as Record<string, unknown>)[
      "__TEST_APP__"
    ] as { getFPS: () => number } | undefined;
    if (hook === undefined) {
      throw new Error(
        "__TEST_APP__ hook not found. Ensure the app is running in dev mode."
      );
    }
    return hook.getFPS();
  });
}

/**
 * Wait for approximately N render frames by waiting N * 16ms.
 * Uses requestAnimationFrame for more accurate frame counting.
 */
export async function waitForRenderFrames(
  page: Page,
  count: number
): Promise<void> {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        let remaining = n;
        function tick(): void {
          remaining--;
          if (remaining <= 0) {
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      }),
    count
  );
}
