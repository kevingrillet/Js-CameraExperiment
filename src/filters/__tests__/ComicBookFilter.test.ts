/**
 * ComicBookFilter tests
 */

import { describe, it, expect } from "vitest";
import { ComicBookFilter } from "../ComicBookFilter";

describe("ComicBookFilter", () => {
  it("should throw for null imageData", () => {
    const filter = new ComicBookFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should posterize colors to multiples of 32", () => {
    const filter = new ComicBookFilter();

    // Create 2x2 image with various color values
    const imageData = {
      width: 2,
      height: 2,
      data: new Uint8ClampedArray(2 * 2 * 4),
    } as ImageData;

    // Set pixels to non-posterized values
    // Pixel 0: (50, 100, 150)
    imageData.data[0] = 50;
    imageData.data[1] = 100;
    imageData.data[2] = 150;
    imageData.data[3] = 255;

    // Pixel 1: (75, 125, 200)
    imageData.data[4] = 75;
    imageData.data[5] = 125;
    imageData.data[6] = 200;
    imageData.data[7] = 255;

    // Pixel 2: (10, 40, 70)
    imageData.data[8] = 10;
    imageData.data[9] = 40;
    imageData.data[10] = 70;
    imageData.data[11] = 255;

    // Pixel 3: (200, 150, 100)
    imageData.data[12] = 200;
    imageData.data[13] = 150;
    imageData.data[14] = 100;
    imageData.data[15] = 255;

    const result = filter.apply(imageData);

    // Check that all RGB values are multiples of 32
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]! % 32).toBe(0); // R
      expect(result.data[i + 1]! % 32).toBe(0); // G
      expect(result.data[i + 2]! % 32).toBe(0); // B
    }

    // Verify specific posterization (value >> 5) << 5
    // 50 -> 32, 100 -> 96, 150 -> 128
    // Note: Edge detection may override some pixels to black (0)
  });

  it("should create black outlines on edges", () => {
    const filter = new ComicBookFilter();

    // Create 5x5 image with clear vertical edge (left half white, right half black)
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill left half with white, right half with black
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = (y * 5 + x) * 4;
        if (x < 2) {
          // Left half: white
          imageData.data[idx] = 255;
          imageData.data[idx + 1] = 255;
          imageData.data[idx + 2] = 255;
        } else {
          // Right half: black
          imageData.data[idx] = 0;
          imageData.data[idx + 1] = 0;
          imageData.data[idx + 2] = 0;
        }
        imageData.data[idx + 3] = 255;
      }
    }

    const result = filter.apply(imageData);

    // Expect black pixels (0,0,0) along the edge (x=2)
    // Due to Sobel edge detection, vertical edges should be detected
    const centerEdgeIdx = (2 * 5 + 2) * 4; // Center of the edge
    expect(result.data[centerEdgeIdx]).toBe(0); // R should be black
    expect(result.data[centerEdgeIdx + 1]).toBe(0); // G should be black
    expect(result.data[centerEdgeIdx + 2]).toBe(0); // B should be black
  });

  it("should handle 3x3 image (edge case with odd dimensions)", () => {
    const filter = new ComicBookFilter();

    const imageData = {
      width: 3,
      height: 3,
      data: new Uint8ClampedArray(3 * 3 * 4),
    } as ImageData;

    // Fill with mid-gray
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 128;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 128;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Should not crash, all values should be multiples of 32
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]! % 32).toBe(0);
      expect(result.data[i + 1]! % 32).toBe(0);
      expect(result.data[i + 2]! % 32).toBe(0);
    }
  });

  it("should continue with posterization if Sobel fails", () => {
    const filter = new ComicBookFilter();

    // Create minimal valid imageData
    const imageData = {
      width: 2,
      height: 2,
      data: new Uint8ClampedArray(2 * 2 * 4),
    } as ImageData;

    // Fill with random values
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 150;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = 255;
    }

    // Apply filter (should not throw even if Sobel has issues)
    expect(() => filter.apply(imageData)).not.toThrow();

    const result = filter.apply(imageData);

    // Posterization should still work
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]! % 32).toBe(0);
      expect(result.data[i + 1]! % 32).toBe(0);
      expect(result.data[i + 2]! % 32).toBe(0);
    }
  });

  it("should cleanup buffers correctly", () => {
    const filter = new ComicBookFilter();

    const imageData = {
      width: 4,
      height: 4,
      data: new Uint8ClampedArray(4 * 4 * 4),
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
});
