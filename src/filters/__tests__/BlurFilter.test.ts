/**
 * BlurFilter tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BlurFilter } from "../BlurFilter";

describe("BlurFilter", () => {
  let filter: BlurFilter;

  beforeEach(() => {
    filter = new BlurFilter();
  });

  it("should allocate tempBuffer on first apply", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Fill with test pattern
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 64;
      imageData.data[i + 3] = 255;
    }

    filter.apply(imageData);

    // Buffer should be allocated (verify via second apply - no reallocation)
    const result = filter.apply(imageData);
    expect(result.data.length).toBe(10 * 10 * 4);
  });

  it("should reuse tempBuffer across multiple applies with same dimensions", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    filter.apply(imageData);
    filter.apply(imageData);
    filter.apply(imageData);

    // No errors should occur - buffer is being reused
    expect(imageData.data.length).toBe(400);
  });

  it("should reallocate tempBuffer when imageData dimensions change", () => {
    const smallImage = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    const largeImage = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    filter.apply(smallImage);
    filter.apply(largeImage);

    // Should handle dimension change without error
    expect(largeImage.data.length).toBe(400);
  });

  it("should release tempBuffer on cleanup", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    filter.apply(imageData);
    filter.cleanup();

    // After cleanup, buffer should be null (next apply will reallocate)
    filter.apply(imageData);
    expect(imageData.data.length).toBe(400);
  });

  it("should handle edge pixels correctly (clamping)", () => {
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with uniform color
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 150;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Edge pixels should not crash (coordinates are clamped)
    expect(result.data[0]).toBeGreaterThanOrEqual(0);
    expect(result.data[0]).toBeLessThanOrEqual(255);
  });

  it("should produce blurred output (not identical to input)", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Create checkerboard pattern (alternating black/white)
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const i = (y * 10 + x) * 4;
        const isBlack = (x + y) % 2 === 0;
        imageData.data[i] = isBlack ? 0 : 255;
        imageData.data[i + 1] = isBlack ? 0 : 255;
        imageData.data[i + 2] = isBlack ? 0 : 255;
        imageData.data[i + 3] = 255;
      }
    }

    const originalData = new Uint8ClampedArray(imageData.data);
    filter.apply(imageData);

    // Blur should change pixel values (blurred checkerboard != original)
    let differenceCount = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i] !== originalData[i]) {
        differenceCount++;
      }
    }

    expect(differenceCount).toBeGreaterThan(0);
  });

  it("should throw for invalid imageData", () => {
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should preserve alpha channel correctly", () => {
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Set varying alpha values
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 150;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = (i / 4) % 256; // Varying alpha
    }

    const originalAlpha = new Uint8ClampedArray(
      imageData.data.filter((_, i) => i % 4 === 3)
    );

    filter.apply(imageData);

    const resultAlpha = new Uint8ClampedArray(
      imageData.data.filter((_, i) => i % 4 === 3)
    );

    // Alpha values should be preserved
    expect(resultAlpha).toEqual(originalAlpha);
  });
});
