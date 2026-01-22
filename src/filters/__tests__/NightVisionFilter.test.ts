/**
 * NightVisionFilter tests
 */

import { describe, it, expect } from "vitest";
import { NightVisionFilter } from "../NightVisionFilter";

describe("NightVisionFilter", () => {
  it("should apply green tint to image", () => {
    const filter = new NightVisionFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with white
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Green channel should dominate
    for (let i = 0; i < result.data.length; i += 4) {
      const r = result.data[i] ?? 0;
      const g = result.data[i + 1] ?? 0;
      const b = result.data[i + 2] ?? 0;

      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b);
    }
  });

  it("should boost brightness", () => {
    const filter = new NightVisionFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with dark gray
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 30;
      imageData.data[i + 1] = 30;
      imageData.data[i + 2] = 30;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Green channel should be significantly boosted (vignette darkens edges)
    let totalGreen = 0;
    for (let i = 1; i < result.data.length; i += 4) {
      totalGreen += result.data[i] ?? 0;
    }

    const avgGreen = totalGreen / (result.data.length / 4);
    expect(avgGreen).toBeGreaterThan(30); // Should be brighter than input
  });

  it("should apply vignette (darker at edges)", () => {
    const filter = new NightVisionFilter();

    const imageData = {
      width: 20,
      height: 20,
      data: new Uint8ClampedArray(20 * 20 * 4),
    } as ImageData;

    // Fill with uniform gray
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 128;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 128;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Center pixel should be brighter than corner pixel
    const centerIdx = (10 * 20 + 10) * 4; // Center at (10, 10)
    const cornerIdx = (0 * 20 + 0) * 4; // Corner at (0, 0)

    const centerG = result.data[centerIdx + 1] ?? 0;
    const cornerG = result.data[cornerIdx + 1] ?? 0;

    expect(centerG).toBeGreaterThan(cornerG);
  });

  it("should add grain/noise (pixels vary slightly)", () => {
    const filter = new NightVisionFilter();

    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Fill with uniform gray
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 128;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 128;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Check that not all center pixels (away from vignette edge) are identical
    const values = new Set<number>();
    for (let y = 4; y < 6; y++) {
      for (let x = 4; x < 6; x++) {
        const i = (y * 10 + x) * 4;
        values.add(result.data[i + 1] ?? 0); // Green channel
      }
    }

    // Grain should cause variation (more than 1 unique value)
    expect(values.size).toBeGreaterThan(1);
  });

  it("should convert color image to green monochrome", () => {
    const filter = new NightVisionFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with red
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255; // Red
      imageData.data[i + 1] = 0; // Green
      imageData.data[i + 2] = 0; // Blue
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Should convert to green based on luminance
    for (let i = 0; i < result.data.length; i += 4) {
      const g = result.data[i + 1] ?? 0;
      expect(g).toBeGreaterThan(0); // Green channel active
    }
  });

  it("should throw for invalid imageData", () => {
    const filter = new NightVisionFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should preserve alpha channel", () => {
    const filter = new NightVisionFilter();

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
    const originalAlpha = Array.from(
      imageData.data.filter((_, i) => i % 4 === 3)
    );

    filter.apply(imageData);

    const resultAlpha = Array.from(
      imageData.data.filter((_, i) => i % 4 === 3)
    );

    expect(resultAlpha).toEqual(originalAlpha);
  });
});
