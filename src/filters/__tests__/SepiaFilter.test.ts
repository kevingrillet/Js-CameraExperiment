/**
 * SepiaFilter tests
 */

import { describe, it, expect } from "vitest";
import { SepiaFilter } from "../SepiaFilter";

describe("SepiaFilter", () => {
  it("should apply sepia tone transformation correctly", () => {
    const filter = new SepiaFilter();

    // Create mock ImageData with a single white pixel
    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4), // 1 pixel * 4 channels
    } as ImageData;

    // Set pixel to white (255, 255, 255, 255)
    imageData.data[0] = 255;
    imageData.data[1] = 255;
    imageData.data[2] = 255;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // Sepia matrix for white (255, 255, 255):
    // R' = 0.393*255 + 0.769*255 + 0.189*255 = 344.655 → clamped to 255
    // G' = 0.349*255 + 0.686*255 + 0.168*255 = 306.465 → clamped to 255
    // B' = 0.272*255 + 0.534*255 + 0.131*255 = 238.785 → 239 (rounded)
    expect(result.data[0]).toBe(255); // Red channel
    expect(result.data[1]).toBe(255); // Green channel
    expect(result.data[2]).toBe(239); // Blue channel
    expect(result.data[3]).toBe(255); // Alpha unchanged
  });

  it("should apply sepia tone to black pixel (no change)", () => {
    const filter = new SepiaFilter();

    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Set pixel to black (0, 0, 0, 255)
    imageData.data[0] = 0;
    imageData.data[1] = 0;
    imageData.data[2] = 0;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // Sepia of black remains black
    expect(result.data[0]).toBe(0);
    expect(result.data[1]).toBe(0);
    expect(result.data[2]).toBe(0);
    expect(result.data[3]).toBe(255);
  });

  it("should apply sepia tone to green pixel", () => {
    const filter = new SepiaFilter();

    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Set pixel to pure green (0, 255, 0, 255)
    imageData.data[0] = 0;
    imageData.data[1] = 255;
    imageData.data[2] = 0;
    imageData.data[3] = 255;

    const result = filter.apply(imageData);

    // Sepia matrix for green (0, 255, 0):
    // R' = 0.393*0 + 0.769*255 + 0.189*0 = 196.095 → 196
    // G' = 0.349*0 + 0.686*255 + 0.168*0 = 174.93 → 175 (rounded)
    // B' = 0.272*0 + 0.534*255 + 0.131*0 = 136.17 → 136
    expect(result.data[0]).toBe(196);
    expect(result.data[1]).toBe(175);
    expect(result.data[2]).toBe(136);
    expect(result.data[3]).toBe(255);
  });

  it("should throw for invalid imageData", () => {
    const filter = new SepiaFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should preserve alpha channel", () => {
    const filter = new SepiaFilter();

    const imageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as ImageData;

    // Set pixel with semi-transparent alpha
    imageData.data[0] = 100;
    imageData.data[1] = 150;
    imageData.data[2] = 200;
    imageData.data[3] = 128; // 50% opacity

    const result = filter.apply(imageData);

    // Alpha should remain unchanged
    expect(result.data[3]).toBe(128);
  });
});
