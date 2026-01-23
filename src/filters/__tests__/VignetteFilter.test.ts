/**
 * VignetteFilter tests
 */

import { describe, it, expect } from "vitest";
import { VignetteFilter } from "../VignetteFilter";

describe("VignetteFilter", () => {
  it("should throw for null imageData", () => {
    const filter = new VignetteFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should throw for undefined imageData", () => {
    const filter = new VignetteFilter();
    expect(() => filter.apply(undefined as unknown as ImageData)).toThrow();
  });

  it("should throw for invalid dimensions (0x0)", () => {
    const filter = new VignetteFilter();
    const imageData = {
      width: 0,
      height: 0,
      data: new Uint8ClampedArray(0),
    } as ImageData;
    expect(() => filter.apply(imageData)).toThrow();
  });

  it("should throw for negative dimensions", () => {
    const filter = new VignetteFilter();
    const imageData = {
      width: -10,
      height: -10,
      data: new Uint8ClampedArray(0),
    } as ImageData;
    expect(() => filter.apply(imageData)).toThrow();
  });

  it("should keep center pixels close to original (tolerance 5%)", () => {
    const filter = new VignetteFilter();

    // Create 5x5 image with uniform white (255,255,255)
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with white
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255; // R
      imageData.data[i + 1] = 255; // G
      imageData.data[i + 2] = 255; // B
      imageData.data[i + 3] = 255; // A
    }

    const result = filter.apply(imageData);

    // Center pixel (2, 2) should be close to original (>95% brightness)
    const centerIdx = (2 * 5 + 2) * 4;
    expect(result.data[centerIdx]).toBeGreaterThan(255 * 0.95);
    expect(result.data[centerIdx + 1]).toBeGreaterThan(255 * 0.95);
    expect(result.data[centerIdx + 2]).toBeGreaterThan(255 * 0.95);
  });

  it("should darken corner pixels significantly (>30% reduction)", () => {
    const filter = new VignetteFilter();

    // Create 5x5 image with uniform white (255,255,255)
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with white
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255; // R
      imageData.data[i + 1] = 255; // G
      imageData.data[i + 2] = 255; // B
      imageData.data[i + 3] = 255; // A
    }

    const result = filter.apply(imageData);

    // Top-left corner pixel (0, 0) should be darkened
    const cornerIdx = (0 * 5 + 0) * 4;
    expect(result.data[cornerIdx]).toBeLessThan(255 * 0.7); // At least 30% darker
    expect(result.data[cornerIdx + 1]).toBeLessThan(255 * 0.7);
    expect(result.data[cornerIdx + 2]).toBeLessThan(255 * 0.7);
  });

  it("should handle 1x1 pixel image (edge case, no vignette)", () => {
    const filter = new VignetteFilter();

    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([128, 128, 128, 255]),
    } as ImageData;

    const result = filter.apply(imageData);

    // 1x1 pixel is at center but also at corner, some darkening will occur
    // Verify it's processed (not NaN) and darkened
    expect(result.data[0]).toBeGreaterThanOrEqual(0);
    expect(result.data[0]).toBeLessThanOrEqual(128);
  });

  it("should handle odd dimensions 3x3 (verify center calculation)", () => {
    const filter = new VignetteFilter();

    const imageData = {
      width: 3,
      height: 3,
      data: new Uint8ClampedArray(3 * 3 * 4),
    } as ImageData;

    // Fill with white
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 200;
      imageData.data[i + 1] = 200;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Center pixel (1, 1) should be brighter than corners, but may have some darkening
    const centerIdx = (1 * 3 + 1) * 4;
    const cornerIdx = 0; // Top-left corner

    // Center should be brighter than corner
    expect(result.data[centerIdx]).toBeGreaterThan(result.data[cornerIdx]!);
  });

  it("should not produce NaN or Infinity in output", () => {
    const filter = new VignetteFilter();

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
});
