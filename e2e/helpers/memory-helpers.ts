import type { Page } from "@playwright/test";

/**
 * Get the current JS heap used size in bytes via CDP.
 */
export async function getHeapUsage(page: Page): Promise<number> {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("Performance.enable");
    const result = await client.send("Performance.getMetrics");
    const metric = result.metrics.find(
      (m: { name: string }) => m.name === "JSHeapUsedSize"
    );
    return metric ? metric.value : 0;
  } finally {
    await client.detach();
  }
}

/**
 * Force garbage collection via CDP HeapProfiler.
 * Requires --js-flags='--expose-gc' in Chromium launch args.
 */
export async function forceGC(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("HeapProfiler.collectGarbage");
  } finally {
    await client.detach();
  }
  // Allow GC to fully complete
  await page.waitForTimeout(500);
}

/**
 * Measure heap delta around an action.
 * Forces GC before and after to get a clean measurement.
 *
 * @returns Heap growth in bytes (after - before)
 */
export async function measureMemoryDelta(
  page: Page,
  action: () => Promise<void>
): Promise<number> {
  await forceGC(page);
  const before = await getHeapUsage(page);
  await action();
  await forceGC(page);
  const after = await getHeapUsage(page);
  return after - before;
}
