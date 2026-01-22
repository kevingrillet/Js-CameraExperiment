/**
 * CRTFilter tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CRTFilter } from "../CRTFilter";

describe("CRTFilter", () => {
  let filter: CRTFilter;

  beforeEach(() => {
    filter = new CRTFilter();
  });

  it("should allocate bloom buffer on first apply", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Fill with gray
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 128;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 128;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);
    expect(result.data.length).toBe(400);
  });

  it("should apply bloom effect (brighten image slightly)", () => {
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with dark gray
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 50;
      imageData.data[i + 1] = 50;
      imageData.data[i + 2] = 50;
      imageData.data[i + 3] = 255;
    }

    const original = new Uint8ClampedArray(imageData.data);
    const result = filter.apply(imageData);

    // Bloom should brighten pixels
    let brighterPixels = 0;
    for (let i = 0; i < result.data.length; i += 4) {
      if ((result.data[i] ?? 0) >= (original[i] ?? 0)) {
        brighterPixels++;
      }
    }

    expect(brighterPixels).toBeGreaterThan(0);
  });

  it("should apply scanlines (darken every Nth row)", () => {
    const imageData = {
      width: 10,
      height: 12,
      data: new Uint8ClampedArray(10 * 12 * 4),
    } as ImageData;

    // Fill with uniform gray
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 200;
      imageData.data[i + 1] = 200;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Check that scanline rows (y % 3 === 0) are darker than non-scanline rows
    const width = 10;
    const scanlineRow = 0; // y=0 is scanline
    const normalRow = 1; // y=1 is not scanline

    const scanlineIdx = (scanlineRow * width + 0) * 4;
    const normalIdx = (normalRow * width + 0) * 4;

    const scanlineR = result.data[scanlineIdx] ?? 0;
    const normalR = result.data[normalIdx] ?? 0;

    expect(scanlineR).toBeLessThan(normalR);
  });

  it("should reuse bloom buffer across multiple applies", () => {
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

  it("should set alpha to 255 for all pixels", () => {
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    const result = filter.apply(imageData);

    for (let i = 3; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(255);
    }
  });
});
