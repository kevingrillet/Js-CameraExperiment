/**
 * RotoscopeFilter tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RotoscopeFilter } from "../RotoscopeFilter";

describe("RotoscopeFilter", () => {
  let filter: RotoscopeFilter;

  beforeEach(() => {
    filter = new RotoscopeFilter();
  });

  it("should allocate edge buffer on first apply", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    const result = filter.apply(imageData);
    expect(result.data.length).toBe(400);
  });

  it("should posterize colors (reduce color palette)", () => {
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with various colors
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 123; // Random R
      imageData.data[i + 1] = 234; // Random G
      imageData.data[i + 2] = 45; // Random B
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Posterized colors should be multiples of step (256/6 ≈ 42.67)
    // Valid values: 0, 42, 85, 128, 170, 213
    const validValues = [0, 42, 85, 128, 170, 213];

    for (let i = 0; i < result.data.length; i += 4) {
      const r = result.data[i] ?? 0;
      const g = result.data[i + 1] ?? 0;
      const b = result.data[i + 2] ?? 0;

      // Allow small tolerance for rounding
      const rValid = validValues.some((v) => Math.abs(r - v) <= 2);
      const gValid = validValues.some((v) => Math.abs(g - v) <= 2);
      const bValid = validValues.some((v) => Math.abs(b - v) <= 2);

      expect(rValid).toBe(true);
      expect(gValid).toBe(true);
      expect(bValid).toBe(true);
    }
  });

  it("should darken edges for cartoon effect", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Create a vertical edge (left half black, right half white)
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const i = (y * 10 + x) * 4;
        if (x < 5) {
          imageData.data[i] = 0;
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
        } else {
          imageData.data[i] = 200;
          imageData.data[i + 1] = 200;
          imageData.data[i + 2] = 200;
        }
        imageData.data[i + 3] = 255;
      }
    }

    const result = filter.apply(imageData);

    // Edge pixels should be darkened compared to non-edge pixels
    // Check pixel at edge (x=5) vs far from edge (x=8)
    const edgeIdx = (5 * 10 + 5) * 4;
    const farIdx = (5 * 10 + 8) * 4;

    const edgeBrightness =
      (result.data[edgeIdx] ?? 0) +
      (result.data[edgeIdx + 1] ?? 0) +
      (result.data[edgeIdx + 2] ?? 0);
    const farBrightness =
      (result.data[farIdx] ?? 0) +
      (result.data[farIdx + 1] ?? 0) +
      (result.data[farIdx + 2] ?? 0);

    expect(edgeBrightness).toBeLessThan(farBrightness);
  });

  it("should reuse edge buffer across multiple applies", () => {
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

  it("should reallocate buffer when dimensions change", () => {
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
    const result = filter.apply(largeImage);

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
    const originalAlpha: number[] = [];
    for (let i = 3; i < imageData.data.length; i += 4) {
      originalAlpha.push(imageData.data[i] ?? 0);
    }

    filter.apply(imageData);

    const resultAlpha: number[] = [];
    for (let i = 3; i < imageData.data.length; i += 4) {
      resultAlpha.push(imageData.data[i] ?? 0);
    }

    expect(resultAlpha).toEqual(originalAlpha);
  });
});
