/**
 * Tests for GlitchFilter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GlitchFilter } from "../GlitchFilter";

describe("GlitchFilter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw on null imageData", () => {
    const filter = new GlitchFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should throw on invalid dimensions", () => {
    const filter = new GlitchFilter();
    const imageData = {
      data: new Uint8ClampedArray(400),
      width: -10,
      height: 10,
      colorSpace: "srgb" as PredefinedColorSpace,
    };
    expect(() => filter.apply(imageData)).toThrow();
  });

  it("should decrement TTL and remove expired glitches", () => {
    const filter = new GlitchFilter();

    // Inject a glitch manually with TTL=2
    (filter as unknown as { activeGlitches: unknown[] }).activeGlitches = [
      {
        type: "shift",
        data: new Uint8ClampedArray(10),
        ttl: 2,
      },
    ];

    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 255;
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    // Mock Math.random to prevent new glitch creation during apply()
    const originalRandom = Math.random;
    Math.random = (): number => 1.0; // Always above probability thresholds (no new glitches)

    // Apply 3 times - TTL should decrement each time
    filter.apply(imageData); // TTL: 2 -> 1
    let activeGlitches = (filter as unknown as { activeGlitches: unknown[] })
      .activeGlitches;
    expect(activeGlitches.length).toBe(1);

    filter.apply(imageData); // TTL: 1 -> 0, removed
    activeGlitches = (filter as unknown as { activeGlitches: unknown[] })
      .activeGlitches;
    expect(activeGlitches.length).toBe(0);

    // Restore Math.random
    Math.random = originalRandom;
  });

  it("should enforce FIFO eviction cap at 50 glitches", () => {
    const filter = new GlitchFilter();
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 255;
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    // Inject 50 glitches
    const activeGlitches: unknown[] = [];
    for (let i = 0; i < 50; i++) {
      activeGlitches.push({
        type: "shift",
        data: new Uint8ClampedArray(10),
        ttl: 10,
      });
    }
    (filter as unknown as { activeGlitches: unknown[] }).activeGlitches =
      activeGlitches;

    // Mock Math.random to force new glitch creation
    vi.spyOn(Math, "random").mockReturnValue(0.05); // Force line shift

    filter.apply(imageData);

    const finalGlitches = (filter as unknown as { activeGlitches: unknown[] })
      .activeGlitches;

    // Should still be <= 50 due to FIFO eviction
    expect(finalGlitches.length).toBeLessThanOrEqual(50);
  });

  it("should not grow unbounded over 300 frames (memory leak test)", () => {
    const filter = new GlitchFilter();
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 255;
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    // Mock Math.random for deterministic behavior (F6 fix)
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      // Cycle through probabilities to trigger some glitches
      callCount++;
      return callCount % 10 === 0 ? 0.05 : 0.95; // 10% glitch rate
    });

    // Apply 300 times (simulate 10 seconds @ 30 FPS)
    for (let i = 0; i < 300; i++) {
      filter.apply(imageData);
    }

    const activeGlitches = (filter as unknown as { activeGlitches: unknown[] })
      .activeGlitches;

    // Must be <= 50 (MAX_ACTIVE_GLITCHES cap)
    expect(activeGlitches.length).toBeLessThanOrEqual(50);
  });

  it("should clear activeGlitches on cleanup", () => {
    const filter = new GlitchFilter();

    // Inject glitches
    (filter as unknown as { activeGlitches: unknown[] }).activeGlitches = [
      { type: "shift", data: new Uint8ClampedArray(10), ttl: 5 },
      { type: "rgb", data: { offset: 5 }, ttl: 3 },
    ];

    filter.cleanup();

    const activeGlitches = (filter as unknown as { activeGlitches: unknown[] })
      .activeGlitches;
    expect(activeGlitches.length).toBe(0);
  });

  it("should allow multiple cleanup calls (idempotent)", () => {
    const filter = new GlitchFilter();
    filter.cleanup();
    expect(() => filter.cleanup()).not.toThrow();
  });

  it("should create glitches deterministically with seeded random", () => {
    const filter = new GlitchFilter();
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 255;
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    // Force line shift glitch (probability 0.10)
    vi.spyOn(Math, "random").mockReturnValue(0.05);

    filter.apply(imageData);

    const activeGlitches = (filter as unknown as { activeGlitches: unknown[] })
      .activeGlitches;

    // At least one glitch should be created
    expect(activeGlitches.length).toBeGreaterThan(0);
  });
});
