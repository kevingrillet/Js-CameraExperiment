/**
 * EdgeDetectionFilter tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { EdgeDetectionFilter } from "../EdgeDetectionFilter";

describe("EdgeDetectionFilter", () => {
  let filter: EdgeDetectionFilter;

  beforeEach(() => {
    filter = new EdgeDetectionFilter();
  });

  it("should allocate Sobel buffer on first apply", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    const result = filter.apply(imageData);
    expect(result.data.length).toBe(400);
  });

  it("should detect edges (high contrast areas become white)", () => {
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
          imageData.data[i] = 0; // Black
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
        } else {
          imageData.data[i] = 255; // White
          imageData.data[i + 1] = 255;
          imageData.data[i + 2] = 255;
        }
        imageData.data[i + 3] = 255;
      }
    }

    const result = filter.apply(imageData);

    // Edge pixels (around x=5) should be white
    let edgePixelsFound = 0;
    for (let y = 1; y < 9; y++) {
      for (let x = 4; x <= 6; x++) {
        const i = (y * 10 + x) * 4;
        if (result.data[i] === 255) {
          edgePixelsFound++;
        }
      }
    }

    expect(edgePixelsFound).toBeGreaterThan(0);
  });

  it("should show no edges for uniform image (all black)", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Fill with uniform black
    imageData.data.fill(0);
    for (let i = 3; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255; // Alpha
    }

    const result = filter.apply(imageData);

    // Interior pixels should be black (no edges in uniform image)
    let blackPixels = 0;
    for (let y = 1; y < 9; y++) {
      for (let x = 1; x < 9; x++) {
        const i = (y * 10 + x) * 4;
        if (result.data[i] === 0) {
          blackPixels++;
        }
      }
    }

    expect(blackPixels).toBeGreaterThan(50); // Most pixels should be black
  });

  it("should reuse Sobel buffer across multiple applies", () => {
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

  it("should produce grayscale output (R=G=B for all pixels)", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    const result = filter.apply(imageData);

    // All pixels should have R=G=B (either 0 or 255)
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(result.data[i + 1]);
      expect(result.data[i + 1]).toBe(result.data[i + 2]);
    }
  });
});
