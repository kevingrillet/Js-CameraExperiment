/**
 * PixelateFilter tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PixelateFilter } from "../PixelateFilter";

describe("PixelateFilter", () => {
  let filter: PixelateFilter;

  beforeEach(() => {
    filter = new PixelateFilter();
  });

  it("should pixelate image into Game Boy resolution blocks", () => {
    const imageData = {
      width: 320,
      height: 288,
      data: new Uint8ClampedArray(320 * 288 * 4),
    } as ImageData;

    // Fill with gradient pattern
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = (i / 4) % 256;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Result should have blocky appearance (adjacent pixels in same block have same color)
    // Check a block (each GB pixel is 2x2 actual pixels in this 320x288 image)
    const idx1 = 0;
    const idx2 = 4; // Adjacent pixel

    expect(result.data[idx1]).toBe(result.data[idx2]); // Same R
    expect(result.data[idx1 + 1]).toBe(result.data[idx2 + 1]); // Same G
    expect(result.data[idx1 + 2]).toBe(result.data[idx2 + 2]); // Same B
  });

  it("should use Game Boy green palette colors only", () => {
    const imageData = {
      width: 160,
      height: 144,
      data: new Uint8ClampedArray(160 * 144 * 4),
    } as ImageData;

    // Fill with various colors
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255; // Red
      imageData.data[i + 1] = 0; // Green
      imageData.data[i + 2] = 0; // Blue
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Valid Game Boy palette RGB values
    const validR = [15, 48, 139, 155];
    const validG = [56, 98, 172, 188];
    const validB = [15, 48, 15, 15];

    // All pixels should use palette colors
    for (let i = 0; i < result.data.length; i += 4) {
      const r = result.data[i];
      const g = result.data[i + 1];
      const b = result.data[i + 2];

      const inPalette =
        validR.includes(r ?? 0) &&
        validG.includes(g ?? 0) &&
        validB.includes(b ?? 0);
      expect(inPalette).toBe(true);
    }
  });

  it("should handle buffer reallocation when dimensions change", () => {
    const smallImage = {
      width: 80,
      height: 72,
      data: new Uint8ClampedArray(80 * 72 * 4),
    } as ImageData;

    const largeImage = {
      width: 320,
      height: 288,
      data: new Uint8ClampedArray(320 * 288 * 4),
    } as ImageData;

    filter.apply(smallImage);
    const result = filter.apply(largeImage);

    expect(result.data.length).toBe(320 * 288 * 4);
  });

  it("should throw for invalid imageData", () => {
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should set alpha to 255 (opaque)", () => {
    const imageData = {
      width: 160,
      height: 144,
      data: new Uint8ClampedArray(160 * 144 * 4),
    } as ImageData;

    // Set varying alpha
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 150;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = (i / 4) % 256; // Varying alpha
    }

    filter.apply(imageData);

    // All alpha values should be 255 (Game Boy has no transparency)
    for (let i = 3; i < imageData.data.length; i += 4) {
      expect(imageData.data[i]).toBe(255);
    }
  });
});
