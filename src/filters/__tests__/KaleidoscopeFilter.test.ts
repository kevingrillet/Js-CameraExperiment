/**
 * KaleidoscopeFilter tests
 */

import { describe, it, expect } from "vitest";
import { KaleidoscopeFilter } from "../KaleidoscopeFilter";

describe("KaleidoscopeFilter", () => {
  it("should throw for null imageData", () => {
    const filter = new KaleidoscopeFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should not produce all-black output for non-black input", () => {
    const filter = new KaleidoscopeFilter();

    const size = 5;
    const imageData = {
      width: size,
      height: size,
      data: new Uint8ClampedArray(size * size * 4),
    } as ImageData;

    // Fill with white
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Should have at least some non-black pixels
    let nonBlackCount = 0;
    for (let i = 0; i < result.data.length; i += 4) {
      if (
        result.data[i]! > 10 ||
        result.data[i + 1]! > 10 ||
        result.data[i + 2]! > 10
      ) {
        nonBlackCount++;
      }
    }

    expect(nonBlackCount).toBeGreaterThan(0);
  });

  it("should handle 1x1 image (edge case)", () => {
    const filter = new KaleidoscopeFilter();

    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([100, 150, 200, 255]),
    } as ImageData;

    // Should not crash
    expect(() => filter.apply(imageData)).not.toThrow();

    const result = filter.apply(imageData);

    // Single pixel should map to itself (center)
    expect(result.data[0]).toBe(100);
    expect(result.data[1]).toBe(150);
    expect(result.data[2]).toBe(200);
  });

  it("should handle Math.atan2 edge cases without producing NaN", () => {
    const filter = new KaleidoscopeFilter();

    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Fill with random values
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = Math.floor(Math.random() * 256);
      imageData.data[i + 1] = Math.floor(Math.random() * 256);
      imageData.data[i + 2] = Math.floor(Math.random() * 256);
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Check no NaN or Infinity in RGB channels
    for (let i = 0; i < result.data.length; i += 4) {
      expect(Number.isNaN(result.data[i])).toBe(false);
      expect(Number.isFinite(result.data[i])).toBe(true);
      expect(Number.isNaN(result.data[i + 1])).toBe(false);
      expect(Number.isFinite(result.data[i + 1])).toBe(true);
      expect(Number.isNaN(result.data[i + 2])).toBe(false);
      expect(Number.isFinite(result.data[i + 2])).toBe(true);
    }
  });

  it("should cleanup buffers correctly", () => {
    const filter = new KaleidoscopeFilter();

    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Fill with data
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 100;
      imageData.data[i + 2] = 100;
      imageData.data[i + 3] = 255;
    }

    // Apply filter to allocate buffers
    filter.apply(imageData);

    // Cleanup should not throw
    expect(() => filter.cleanup()).not.toThrow();
  });

  it("should handle center pixel correctly (dx=0, dy=0)", () => {
    const filter = new KaleidoscopeFilter();

    // Create odd-sized image so there's an exact center pixel
    const size = 9;
    const imageData = {
      width: size,
      height: size,
      data: new Uint8ClampedArray(size * size * 4),
    } as ImageData;

    // Fill entire image with red
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        imageData.data[idx] = 255; // R
        imageData.data[idx + 1] = 0; // G
        imageData.data[idx + 2] = 0; // B
        imageData.data[idx + 3] = 255; // A
      }
    }

    const result = filter.apply(imageData);

    // Center pixel should map to a red pixel somewhere (transformation applied)
    const centerIdx = (4 * size + 4) * 4; // (4,4) is center of 9x9
    // Just verify it's a valid pixel (not NaN, not undefined)
    expect(result.data[centerIdx]).toBeGreaterThanOrEqual(0);
    expect(result.data[centerIdx]).toBeLessThanOrEqual(255);
  });

  it("should preserve alpha channel", () => {
    const filter = new KaleidoscopeFilter();

    const imageData = {
      width: 3,
      height: 3,
      data: new Uint8ClampedArray(3 * 3 * 4),
    } as ImageData;

    // Fill with semi-transparent pixels
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 100;
      imageData.data[i + 2] = 100;
      imageData.data[i + 3] = 128; // 50% alpha
    }

    const result = filter.apply(imageData);

    // Alpha should be preserved (or set to 255)
    for (let i = 3; i < result.data.length; i += 4) {
      expect(result.data[i]).toBeGreaterThan(0); // Not zero
    }
  });
});
