/**
 * FPSCounter tests
 * Tests the FPS calculation and averaging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FPSCounter } from "../FPSCounter";

describe("FPSCounter", () => {
  let fpsCounter: FPSCounter;
  let mockTime = 0;

  beforeEach(() => {
    // Mock performance.now() to control time
    mockTime = 0;
    vi.spyOn(performance, "now").mockImplementation(() => mockTime);
    fpsCounter = new FPSCounter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with 0 FPS", () => {
    expect(fpsCounter.getFPS()).toBe(0);
  });

  it("should calculate FPS correctly", () => {
    // Simulate 60 FPS (16.67ms per frame)
    mockTime = 0;
    fpsCounter.update();

    // Second frame after 16.67ms
    mockTime = 16.67;
    fpsCounter.update();

    const fps = fpsCounter.getFPS();
    expect(fps).toBeGreaterThan(50); // Should be around 60 FPS
    expect(fps).toBeLessThan(70);
  });

  it("should average FPS over multiple frames", () => {
    mockTime = 0;

    // Simulate varying frame times
    fpsCounter.update();

    mockTime = 16; // ~62 FPS
    fpsCounter.update();

    mockTime = 36; // ~50 FPS (20ms delta)
    fpsCounter.update();

    mockTime = 53; // ~59 FPS (17ms delta)
    fpsCounter.update();

    const fps = fpsCounter.getFPS();
    expect(fps).toBeGreaterThan(45);
    expect(fps).toBeLessThan(65);
  });

  it("should handle very fast frame rates", () => {
    mockTime = 0;

    fpsCounter.update();
    mockTime = 1; // 1000 FPS
    fpsCounter.update();

    const fps = fpsCounter.getFPS();
    expect(fps).toBeGreaterThan(500);
  });

  it("should handle very slow frame rates", () => {
    mockTime = 0;

    fpsCounter.update();
    mockTime = 1000; // 1 FPS
    fpsCounter.update();

    const fps = fpsCounter.getFPS();
    expect(fps).toBeGreaterThan(0);
    expect(fps).toBeLessThan(2);
  });

  it("should update FPS on each tick", () => {
    mockTime = 0;

    fpsCounter.update();
    mockTime = 16.67;
    fpsCounter.update();

    const fps1 = fpsCounter.getFPS();

    mockTime = 33.34;
    fpsCounter.update();

    const fps2 = fpsCounter.getFPS();

    // Both should be similar since frame times are consistent
    expect(Math.abs(fps1 - fps2)).toBeLessThan(5);
  });
});
