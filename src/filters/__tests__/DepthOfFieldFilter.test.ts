/**
 * DepthOfFieldFilter tests
 */

import { describe, it, expect } from "vitest";
import { DepthOfFieldFilter } from "../DepthOfFieldFilter";

describe("DepthOfFieldFilter", () => {
  it("should throw for null imageData", () => {
    const filter = new DepthOfFieldFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should keep focus zone (center) sharp", () => {
    const filter = new DepthOfFieldFilter();

    // Create 21x21 image (focus radius = 0.3 * 21 = 6.3, so center ~7 pixels should be sharp)
    const size = 21;
    const imageData = {
      width: size,
      height: size,
      data: new Uint8ClampedArray(size * size * 4),
    } as ImageData;

    // Fill with pattern (alternating colors for variance)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const value = (x + y) % 2 === 0 ? 200 : 50;
        imageData.data[idx] = value;
        imageData.data[idx + 1] = value;
        imageData.data[idx + 2] = value;
        imageData.data[idx + 3] = 255;
      }
    }

    // Store original center pixel value
    const centerIdx = (10 * size + 10) * 4;
    const originalValue = imageData.data[centerIdx]!;

    const result = filter.apply(imageData);

    // Center pixel should remain close to original (sharp, no blur)
    // Tolerance 5% since focus zone has kernel=0
    expect(Math.abs(result.data[centerIdx]! - originalValue)).toBeLessThan(
      originalValue * 0.05
    );
  });

  it("should blur edge pixels progressively", () => {
    const filter = new DepthOfFieldFilter();

    // Create 21x21 image with high-frequency pattern
    const size = 21;
    const imageData = {
      width: size,
      height: size,
      data: new Uint8ClampedArray(size * size * 4),
    } as ImageData;

    // Fill with checkerboard pattern for maximum variance
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const value = (x + y) % 2 === 0 ? 255 : 0;
        imageData.data[idx] = value;
        imageData.data[idx + 1] = value;
        imageData.data[idx + 2] = value;
        imageData.data[idx + 3] = 255;
      }
    }

    const result = filter.apply(imageData);

    // Corner pixel (0,0) should be blurred (averaged with neighbors)
    // In checkerboard, blur should produce mid-gray values (~127)
    const cornerIdx = 0;
    const cornerValue = result.data[cornerIdx]!;

    // Blurred checkerboard should be somewhere between 0 and 255 (not extremes)
    expect(cornerValue).toBeGreaterThan(50);
    expect(cornerValue).toBeLessThan(205);
  });

  it("should handle 1x1 image (edge case, no blur possible)", () => {
    const filter = new DepthOfFieldFilter();

    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([128, 128, 128, 255]),
    } as ImageData;

    // Should not crash
    expect(() => filter.apply(imageData)).not.toThrow();

    const result = filter.apply(imageData);

    // Single pixel should remain unchanged (no neighbors to blur with)
    expect(result.data[0]).toBe(128);
    expect(result.data[1]).toBe(128);
    expect(result.data[2]).toBe(128);
  });

  it("should not produce NaN in distance calculations", () => {
    const filter = new DepthOfFieldFilter();

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
    const filter = new DepthOfFieldFilter();

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

  it("should reallocate buffers when dimensions change", () => {
    const filter = new DepthOfFieldFilter();

    // First apply with 5x5
    const imageData1 = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;
    for (let i = 0; i < imageData1.data.length; i += 4) {
      imageData1.data[i] = 100;
      imageData1.data[i + 1] = 100;
      imageData1.data[i + 2] = 100;
      imageData1.data[i + 3] = 255;
    }
    filter.apply(imageData1);

    // Then apply with 10x10 (different dimensions)
    const imageData2 = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;
    for (let i = 0; i < imageData2.data.length; i += 4) {
      imageData2.data[i] = 150;
      imageData2.data[i + 1] = 150;
      imageData2.data[i + 2] = 150;
      imageData2.data[i + 3] = 255;
    }

    // Should not crash when dimensions change (buffer reallocation)
    expect(() => filter.apply(imageData2)).not.toThrow();
  });
});
