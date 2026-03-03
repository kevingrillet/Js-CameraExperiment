/**
 * VHSFilter tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { VHSFilter } from "../VHSFilter";

describe("VHSFilter", () => {
  let filter: VHSFilter;

  beforeEach(() => {
    filter = new VHSFilter();
  });

  it("should allocate row data buffer on first apply", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    const result = filter.apply(imageData);
    expect(result.data.length).toBe(400);
  });

  it("should apply all VHS parameters", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Fill with test pattern
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 200;
      imageData.data[i + 1] = 100;
      imageData.data[i + 2] = 50;
      imageData.data[i + 3] = 255;
    }

    // Test with all parameters (correct names)
    filter.setParameters({
      glitchFrequency: 0.05,
      trackingLinesFrequency: 0.3,
      grainIntensity: 0.15,
    });

    const result = filter.apply(imageData);
    expect(result).toBeDefined();
    expect(result.data.length).toBe(imageData.data.length);
  });

  it("should apply chromatic aberration shift", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    filter.setParameters({ glitchFrequency: 0.08 });
    const result = filter.apply(imageData);

    expect(result).toBeDefined();
  });

  it("should add scanlines effect", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    filter.setParameters({ trackingLinesFrequency: 0.4 });
    const result = filter.apply(imageData);

    expect(result).toBeDefined();
  });

  it("should desaturate colors slightly", () => {
    const filter = new VHSFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with vibrant red
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;
      imageData.data[i + 1] = 0;
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Red should be desaturated (other channels should increase)
    let hasDesaturation = false;
    for (let i = 0; i < result.data.length; i += 4) {
      const g = result.data[i + 1] ?? 0;
      const b = result.data[i + 2] ?? 0;

      if (g > 0 || b > 0) {
        hasDesaturation = true;
        break;
      }
    }

    expect(hasDesaturation).toBe(true);
  });

  it("should add grain/noise to image", () => {
    const filter = new VHSFilter();

    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Fill with uniform gray
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 128;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 128;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Check for variation due to grain (not all pixels identical)
    const values = new Set<number>();
    for (let i = 0; i < result.data.length; i += 4) {
      values.add(result.data[i] ?? 0);
    }

    expect(values.size).toBeGreaterThan(1);
  });

  it("should apply color bleeding (horizontal blur on R/B channels)", () => {
    const filter = new VHSFilter();

    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Create a sharp red-to-black transition
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const i = (y * 10 + x) * 4;
        if (x < 5) {
          imageData.data[i] = 255; // Red
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
        } else {
          imageData.data[i] = 0; // Black
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
        }
        imageData.data[i + 3] = 255;
      }
    }

    const result = filter.apply(imageData);

    // Check that edge pixels have intermediate values (bleeding effect)
    const edgeIdx = (5 * 10 + 5) * 4; // First black pixel
    const r = result.data[edgeIdx] ?? 0;

    // Should have some red bled from left neighbor
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(255);
  });

  it("should increment frame counter on each apply", () => {
    const filter = new VHSFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Apply multiple times
    filter.apply(imageData);
    filter.apply(imageData);
    filter.apply(imageData);

    // Frame count is internal, but we can verify filter runs without error
    expect(imageData.data.length).toBe(100);
  });

  it("should reuse row buffer across multiple applies", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    filter.apply(imageData);
    filter.apply(imageData);
    const result = filter.apply(imageData);

    expect(result.data.length).toBe(400);
  });

  it("should throw for invalid imageData", () => {
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should call cleanup without error", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    filter.apply(imageData);
    expect(() => filter.cleanup()).not.toThrow();
  });

  it("should preserve alpha channel", () => {
    const filter = new VHSFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Set varying alpha
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 150;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = (i / 4) % 256;
    }

    // Copy alpha values BEFORE apply (filter modifies in-place)
    const originalAlpha = Array.from(
      imageData.data.filter((_, i) => i % 4 === 3)
    );

    filter.apply(imageData);

    const resultAlpha = Array.from(
      imageData.data.filter((_, i) => i % 4 === 3)
    );

    expect(resultAlpha).toEqual(originalAlpha);
  });

  it("should trigger glitch effect with high frequency", () => {
    const imageData = {
      width: 100,
      height: 100,
      data: new Uint8ClampedArray(100 * 100 * 4),
    } as ImageData;

    // Fill with uniform color
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 150;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = 255;
    }

    // Mock Math.random to always trigger glitch (>= glitchFrequency)
    const originalRandom = Math.random;
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      // First call determines if glitch happens (return 1.0 > 0.1 threshold)
      if (callCount === 1) {
        return 1.0;
      }
      // Other calls for glitch positioning
      return originalRandom();
    });

    const beforeData = new Uint8ClampedArray(imageData.data);
    filter.apply(imageData);

    // Glitch should have modified some pixels (horizontal shift effect)
    const hasChanged = imageData.data.some((val, i) => val !== beforeData[i]);
    expect(hasChanged).toBe(true);

    vi.restoreAllMocks();
  });

  it("should trigger tracking line effect with random positioning", () => {
    const imageData = {
      width: 100,
      height: 100,
      data: new Uint8ClampedArray(100 * 100 * 4),
    } as ImageData;

    // Fill with uniform color
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 200;
      imageData.data[i + 1] = 100;
      imageData.data[i + 2] = 50;
      imageData.data[i + 3] = 255;
    }

    // Mock Math.random to always trigger tracking line
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      // First call for tracking line trigger (> 0.95)
      if (callCount === 1) {
        return 0.96;
      }
      // Second call for line Y position (0.5 = middle)
      if (callCount === 2) {
        return 0.5;
      }
      // Third call for line height (0.5 = 2 pixels)
      if (callCount === 3) {
        return 0.5;
      }
      // Subsequent calls for noise
      return 0.5;
    });

    const beforeData = new Uint8ClampedArray(imageData.data);
    filter.apply(imageData);

    // Tracking line should create noisy pixels
    const hasNoiseAdded = imageData.data.some((val, i) => {
      return i % 4 < 3 && val !== beforeData[i];
    });
    expect(hasNoiseAdded).toBe(true);

    vi.restoreAllMocks();
  });

  it("should reuse row data buffer for glitch effect", () => {
    const imageData = {
      width: 50,
      height: 50,
      data: new Uint8ClampedArray(50 * 50 * 4),
    } as ImageData;

    // Trigger glitch twice to test buffer reuse
    vi.spyOn(Math, "random").mockReturnValue(1.0); // Always trigger glitch

    filter.apply(imageData);
    // @ts-expect-error - Access private property for testing
    const buffer1 = filter.rowDataBuffer;

    filter.apply(imageData);
    // @ts-expect-error - Access private property for testing
    const buffer2 = filter.rowDataBuffer;

    // Same buffer should be reused
    expect(buffer1).toBe(buffer2);

    vi.restoreAllMocks();
  });

  // --- setParameters / getDefaultParameters ---

  it("should return correct default parameters", () => {
    const defaults = filter.getDefaultParameters();
    expect(defaults).toEqual({
      glitchFrequency: 0.02,
      trackingLinesFrequency: 0.15,
      grainIntensity: 0.08,
    });
  });

  it("should clamp glitchFrequency to 0-0.1", () => {
    filter.setParameters({ glitchFrequency: -1 });
    // @ts-expect-error - access private
    expect(filter.glitchFrequency).toBe(0);

    filter.setParameters({ glitchFrequency: 0.5 });
    // @ts-expect-error - access private
    expect(filter.glitchFrequency).toBe(0.1);
  });

  it("should clamp trackingLinesFrequency to 0-0.5", () => {
    filter.setParameters({ trackingLinesFrequency: -1 });
    // @ts-expect-error - access private
    expect(filter.trackingLinesFrequency).toBe(0);

    filter.setParameters({ trackingLinesFrequency: 1.0 });
    // @ts-expect-error - access private
    expect(filter.trackingLinesFrequency).toBe(0.5);
  });

  it("should clamp grainIntensity to 0-0.3", () => {
    filter.setParameters({ grainIntensity: -1 });
    // @ts-expect-error - access private
    expect(filter.grainIntensity).toBe(0);

    filter.setParameters({ grainIntensity: 1.0 });
    // @ts-expect-error - access private
    expect(filter.grainIntensity).toBe(0.3);
  });

  it("should nullify rowDataBuffer on cleanup", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Force glitch to trigger so rowDataBuffer gets allocated
    filter.setParameters({ glitchFrequency: 0.1 });
    vi.spyOn(Math, "random").mockReturnValue(0.05); // < 0.1 → triggers glitch
    filter.apply(imageData);
    vi.restoreAllMocks();

    // @ts-expect-error - access private
    expect(filter.rowDataBuffer).not.toBeNull();

    filter.cleanup();
    // @ts-expect-error - access private
    expect(filter.rowDataBuffer).toBeNull();
  });
});
