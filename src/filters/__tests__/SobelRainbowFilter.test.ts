/**
 * Tests for SobelRainbowFilter
 */

import { describe, it, expect } from "vitest";
import { SobelRainbowFilter } from "../SobelRainbowFilter";

describe("SobelRainbowFilter", () => {
  it("should throw on null imageData", () => {
    const filter = new SobelRainbowFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should throw on invalid dimensions", () => {
    const filter = new SobelRainbowFilter();
    const imageData = {
      data: new Uint8ClampedArray(400),
      width: 10,
      height: -5,
      colorSpace: "srgb" as PredefinedColorSpace,
    };
    expect(() => filter.apply(imageData)).toThrow();
  });

  it("should return valid ImageData after applying filter", () => {
    const filter = new SobelRainbowFilter();
    const width = 20;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);

    // Create vertical edge: left half black, right half white
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = x < 10 ? 0 : 255;
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
        data[idx + 3] = 255;
      }
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    const result = filter.apply(imageData);

    expect(result).toBeDefined();
    expect(result.width).toBe(width);
    expect(result.height).toBe(height);
  });

  it("should produce colored edges for vertical edge", () => {
    const filter = new SobelRainbowFilter();
    const width = 20;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);

    // Create vertical edge
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = x < 10 ? 0 : 255;
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
        data[idx + 3] = 255;
      }
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    filter.apply(imageData);

    // Check center pixel (10, 10) - should have colored edge
    const centerIdx = (10 * width + 10) * 4;
    const r = data[centerIdx]!;
    const g = data[centerIdx + 1]!;
    const b = data[centerIdx + 2]!;

    // Edge should NOT be black (should have color)
    expect(r + g + b).toBeGreaterThan(0);
  });

  it("should produce black background for uniform image", () => {
    const filter = new SobelRainbowFilter();
    const width = 20;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);

    // All gray (no edges)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;
      data[i + 1] = 128;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }

    const imageData: ImageData = {
      data,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    filter.apply(imageData);

    // Count black pixels
    let blackPixelCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
        blackPixelCount++;
      }
    }

    // Most pixels should be black (no edges detected)
    const totalPixels = width * height;
    expect(blackPixelCount).toBeGreaterThan(totalPixels * 0.9);
  });

  it("should produce different colors for horizontal vs vertical edges", () => {
    const filter = new SobelRainbowFilter();
    const width = 20;
    const height = 20;

    // Test vertical edge
    const dataV = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = x < 10 ? 0 : 255;
        dataV[idx] = value;
        dataV[idx + 1] = value;
        dataV[idx + 2] = value;
        dataV[idx + 3] = 255;
      }
    }

    const imageDataV: ImageData = {
      data: dataV,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    filter.apply(imageDataV);
    const centerIdxV = (10 * width + 10) * 4;
    const colorV = `${dataV[centerIdxV]},${dataV[centerIdxV + 1]},${dataV[centerIdxV + 2]}`;

    // Test horizontal edge
    const dataH = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = y < 10 ? 0 : 255;
        dataH[idx] = value;
        dataH[idx + 1] = value;
        dataH[idx + 2] = value;
        dataH[idx + 3] = 255;
      }
    }

    const imageDataH: ImageData = {
      data: dataH,
      width,
      height,
      colorSpace: "srgb" as PredefinedColorSpace,
    };

    filter.apply(imageDataH);
    const centerIdxH = (10 * width + 10) * 4;
    const colorH = `${dataH[centerIdxH]},${dataH[centerIdxH + 1]},${dataH[centerIdxH + 2]}`;

    // Vertical and horizontal edges should have different colors
    expect(colorV).not.toBe(colorH);
  });

  it("should call cleanup without errors", () => {
    const filter = new SobelRainbowFilter();
    expect(() => filter.cleanup()).not.toThrow();
  });

  it("should allow multiple cleanup calls (idempotent)", () => {
    const filter = new SobelRainbowFilter();
    filter.cleanup();
    expect(() => filter.cleanup()).not.toThrow();
  });
});
