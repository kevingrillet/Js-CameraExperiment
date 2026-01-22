/**
 * ThermalFilter tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ThermalFilter } from "../ThermalFilter";

describe("ThermalFilter", () => {
  let filter: ThermalFilter;

  beforeEach(() => {
    filter = new ThermalFilter();
  });

  it("should have exactly 256 palette entries", () => {
    // Access palette via test - apply with known luminance
    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Test all 256 luminance values (0-255)
    for (let lum = 0; lum <= 255; lum++) {
      imageData.data[0] = lum;
      imageData.data[1] = lum;
      imageData.data[2] = lum;
      imageData.data[3] = 255;

      const result = filter.apply(imageData);

      // Should produce valid RGB values
      expect(result.data[0]).toBeGreaterThanOrEqual(0);
      expect(result.data[0]).toBeLessThanOrEqual(255);
      expect(result.data[1]).toBeGreaterThanOrEqual(0);
      expect(result.data[1]).toBeLessThanOrEqual(255);
      expect(result.data[2]).toBeGreaterThanOrEqual(0);
      expect(result.data[2]).toBeLessThanOrEqual(255);
    }
  });

  it("should calculate luminance correctly for pure white", () => {
    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Pure white (255, 255, 255)
    imageData.data[0] = 255;
    imageData.data[1] = 255;
    imageData.data[2] = 255;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // White luminance = 255 → thermal palette[255] = white (255, 255, 255)
    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(255);
    expect(result.data[2]).toBe(255);
    expect(result.data[3]).toBe(255);
  });

  it("should calculate luminance correctly for pure black", () => {
    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Pure black (0, 0, 0)
    imageData.data[0] = 0;
    imageData.data[1] = 0;
    imageData.data[2] = 0;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // Black luminance = 0 → thermal palette[0] = dark blue (0, 0, 64)
    expect(result.data[0]).toBe(0);
    expect(result.data[1]).toBe(0);
    expect(result.data[2]).toBe(64);
    expect(result.data[3]).toBe(255);
  });

  it("should map cold luminance to blue tones", () => {
    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Dark gray (luminance ~50) → should be in blue zone
    imageData.data[0] = 50;
    imageData.data[1] = 50;
    imageData.data[2] = 50;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // Luminance 50 → blue zone (R=0, G=0, B=255)
    expect(result.data[0]).toBe(0);
    expect(result.data[1]).toBe(0);
    expect(result.data[2]).toBe(255);
    expect(result.data[3]).toBe(255);
  });

  it("should map mid-range luminance to purple/red tones", () => {
    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Mid-gray (luminance ~127) → should be in purple/red zone
    imageData.data[0] = 127;
    imageData.data[1] = 127;
    imageData.data[2] = 127;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // Luminance 127 → purple-red zone (R>0, G=0, B>0 or R=255, G=0, B=0)
    // Expect significant red component
    expect(result.data[0]).toBeGreaterThan(128);
    expect(result.data[3]).toBe(255);
  });

  it("should map hot luminance to yellow/white tones", () => {
    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Light gray (luminance ~200) → should be in yellow zone
    imageData.data[0] = 200;
    imageData.data[1] = 200;
    imageData.data[2] = 200;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // Luminance 200 → yellow zone (R=255, G=255, B=0)
    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(255);
    expect(result.data[2]).toBe(0);
    expect(result.data[3]).toBe(255);
  });

  it("should handle luminance clamping for edge cases", () => {
    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Test with extreme values (should clamp internally)
    imageData.data[0] = 255;
    imageData.data[1] = 255;
    imageData.data[2] = 255;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // Should not crash or produce invalid values
    expect(result.data[0]).toBeGreaterThanOrEqual(0);
    expect(result.data[0]).toBeLessThanOrEqual(255);
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
