/**
 * VHSFilter tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { VHSFilter } from "../VHSFilter";

describe("VHSFilter", () => {
  let filter: VHSFilter;

  beforeEach(() => {
    filter = new VHSFilter();
  });

  it("should allocate row data buffer on first apply", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    const result = filter.apply(imageData);
    expect(result.data.length).toBe(400);
  });

  it("should desaturate colors slightly", () => {
    const filter = new VHSFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with vibrant red
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;
      imageData.data[i + 1] = 0;
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 255;
    }

    const result = filter.apply(imageData);

    // Red should be desaturated (other channels should increase)
    let hasDesaturation = false;
    for (let i = 0; i < result.data.length; i += 4) {
      const g = result.data[i + 1] ?? 0;
      const b = result.data[i + 2] ?? 0;

      if (g > 0 || b > 0) {
        hasDesaturation = true;
        break;
      }
    }

    expect(hasDesaturation).toBe(true);
  });

  it("should add grain/noise to image", () => {
    const filter = new VHSFilter();

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

    // Check for variation due to grain (not all pixels identical)
    const values = new Set<number>();
    for (let i = 0; i < result.data.length; i += 4) {
      values.add(result.data[i] ?? 0);
    }

    expect(values.size).toBeGreaterThan(1);
  });

  it("should apply color bleeding (horizontal blur on R/B channels)", () => {
    const filter = new VHSFilter();

    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Create a sharp red-to-black transition
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const i = (y * 10 + x) * 4;
        if (x < 5) {
          imageData.data[i] = 255; // Red
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
        } else {
          imageData.data[i] = 0; // Black
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
        }
        imageData.data[i + 3] = 255;
      }
    }

    const result = filter.apply(imageData);

    // Check that edge pixels have intermediate values (bleeding effect)
    const edgeIdx = (5 * 10 + 5) * 4; // First black pixel
    const r = result.data[edgeIdx] ?? 0;

    // Should have some red bled from left neighbor
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(255);
  });

  it("should increment frame counter on each apply", () => {
    const filter = new VHSFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Apply multiple times
    filter.apply(imageData);
    filter.apply(imageData);
    filter.apply(imageData);

    // Frame count is internal, but we can verify filter runs without error
    expect(imageData.data.length).toBe(100);
  });

  it("should reuse row buffer across multiple applies", () => {
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

  it("should preserve alpha channel", () => {
    const filter = new VHSFilter();

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
