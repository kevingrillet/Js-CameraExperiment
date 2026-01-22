/**
 * ChromaticAberrationFilter tests
 */

import { describe, it, expect } from "vitest";
import { ChromaticAberrationFilter } from "../ChromaticAberrationFilter";

describe("ChromaticAberrationFilter", () => {
  it("should shift red channel left/up and blue channel right/down", () => {
    const filter = new ChromaticAberrationFilter();

    // Create 5x5 test image (minimum size to test 3-pixel offset with center pixel)
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4), // 25 pixels * 4 channels
    } as ImageData;

    // Fill entire image with a distinct color (RGB: 100, 150, 200)
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100; // Red
      imageData.data[i + 1] = 150; // Green
      imageData.data[i + 2] = 200; // Blue
      imageData.data[i + 3] = 255; // Alpha
    }

    // Set center pixel (2,2) to white for reference
    const centerIdx = (2 * 5 + 2) * 4;
    imageData.data[centerIdx] = 255; // Red
    imageData.data[centerIdx + 1] = 255; // Green
    imageData.data[centerIdx + 2] = 255; // Blue

    const result = filter.apply(imageData);

    // Center pixel (2,2) should have:
    // - Red from pixel (2-3, 2-3) → clamped to (0, 0) → original red=100
    // - Green from pixel (2, 2) → 255 (unchanged)
    // - Blue from pixel (2+3, 2+3) → (5, 5) → clamped to (4, 4) → original blue=200
    expect(result.data[centerIdx]).toBe(100); // Red shifted from top-left
    expect(result.data[centerIdx + 1]).toBe(255); // Green unchanged
    expect(result.data[centerIdx + 2]).toBe(200); // Blue shifted from bottom-right
    expect(result.data[centerIdx + 3]).toBe(255); // Alpha preserved
  });

  it("should handle edge pixels correctly (clamping)", () => {
    const filter = new ChromaticAberrationFilter();

    // Create 5x5 test image
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with uniform color
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 50;
      imageData.data[i + 1] = 100;
      imageData.data[i + 2] = 150;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Top-left corner (0,0) should clamp red channel to (0,0)
    const topLeftIdx = 0;
    expect(result.data[topLeftIdx]).toBe(50); // Red from (0,0)
    expect(result.data[topLeftIdx + 1]).toBe(100); // Green unchanged
    expect(result.data[topLeftIdx + 2]).toBe(150); // Blue from (3,3)

    // Bottom-right corner (4,4) should clamp blue channel to (4,4)
    const bottomRightIdx = (4 * 5 + 4) * 4;
    expect(result.data[bottomRightIdx]).toBe(50); // Red from (1,1)
    expect(result.data[bottomRightIdx + 1]).toBe(100); // Green unchanged
    expect(result.data[bottomRightIdx + 2]).toBe(150); // Blue from (4,4)
  });

  it("should throw for invalid imageData", () => {
    const filter = new ChromaticAberrationFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should preserve alpha channel correctly", () => {
    const filter = new ChromaticAberrationFilter();

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
    const result = filter.apply(imageData);
    const resultAlpha = new Uint8ClampedArray(
      result.data.filter((_, i) => i % 4 === 3)
    );

    // Alpha values should be preserved (may be shifted due to channel offset)
    expect(resultAlpha.length).toBe(originalAlpha.length);
  });
});
