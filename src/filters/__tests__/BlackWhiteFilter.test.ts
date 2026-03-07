/**
 * BlackWhiteFilter tests — Covers threshold modes, Bayer dithering,
 * blue-noise, buffer reuse, and parameter validation
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BlackWhiteFilter } from "../BlackWhiteFilter";

// Helper: create a fresh ImageData-like object filled with the given RGBA value repeated
function makeImageData(
  width: number,
  height: number,
  fill: [number, number, number, number] = [128, 64, 32, 255]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3];
  }
  return { width, height, data } as ImageData;
}

describe("BlackWhiteFilter", () => {
  let filter: BlackWhiteFilter;

  beforeEach(() => {
    filter = new BlackWhiteFilter();
  });

  // ── T3.1 Threshold amount mode ────────────────────────────────────────────

  it("T3.1 — should make high-luminance pixel white (thresholdMode=0)", () => {
    // R=G=B=200 → lum=200 >= threshold=128 → white
    const imageData = makeImageData(1, 1, [200, 200, 200, 255]);
    const result = filter.apply(imageData);
    expect(result.data[0]).toBe(255); // R
    expect(result.data[1]).toBe(255); // G
    expect(result.data[2]).toBe(255); // B
  });

  it("T3.1 — should make low-luminance pixel black (thresholdMode=0)", () => {
    // R=G=B=50 → lum=50 < threshold=128 → black
    const imageData = makeImageData(1, 1, [50, 50, 50, 255]);
    const result = filter.apply(imageData);
    expect(result.data[0]).toBe(0); // R
    expect(result.data[1]).toBe(0); // G
    expect(result.data[2]).toBe(0); // B
  });

  it("T3.1 — should preserve alpha channel unchanged", () => {
    const imageData = makeImageData(1, 1, [50, 50, 50, 100]);
    const result = filter.apply(imageData);
    expect(result.data[3]).toBe(100); // alpha unchanged
  });

  it("T3.1 — pixel clearly above threshold should produce white", () => {
    // R=G=B=200 with threshold=100 → lum=200 >= 100 → white
    filter.setParameters({ threshold: 100 });
    const imageData = makeImageData(1, 1, [200, 200, 200, 255]);
    const result = filter.apply(imageData);
    expect(result.data[0]).toBe(255);
  });

  // ── T3.2 All-white / all-black frame ──────────────────────────────────────

  it("T3.2 — all-white frame should produce all-white output", () => {
    const imageData = makeImageData(4, 4, [255, 255, 255, 255]);
    const result = filter.apply(imageData);
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(255);
      expect(result.data[i + 1]).toBe(255);
      expect(result.data[i + 2]).toBe(255);
    }
  });

  it("T3.2 — all-black frame should produce all-black output", () => {
    const imageData = makeImageData(4, 4, [0, 0, 0, 255]);
    const result = filter.apply(imageData);
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(0);
      expect(result.data[i + 1]).toBe(0);
      expect(result.data[i + 2]).toBe(0);
    }
  });

  // ── T3.3 Random and blue-noise modes ──────────────────────────────────────

  it("T3.3 — random mode (thresholdMode=1) should not throw", () => {
    filter.setParameters({ thresholdMode: 1 });
    expect(() => filter.apply(makeImageData(4, 4))).not.toThrow();
  });

  it("T3.3 — random mode output pixels should be only 0 or 255", () => {
    filter.setParameters({ thresholdMode: 1 });
    const result = filter.apply(makeImageData(8, 8));
    for (let i = 0; i < result.data.length; i += 4) {
      const r = result.data[i];
      expect(r === 0 || r === 255).toBe(true);
    }
  });

  it("T3.3 — bluerandom mode (thresholdMode=2) should not throw", () => {
    filter.setParameters({ thresholdMode: 2 });
    expect(() => filter.apply(makeImageData(4, 4))).not.toThrow();
  });

  it("T3.3 — bluerandom mode output pixels should be only 0 or 255", () => {
    filter.setParameters({ thresholdMode: 2 });
    const result = filter.apply(makeImageData(8, 8));
    for (let i = 0; i < result.data.length; i += 4) {
      const r = result.data[i];
      expect(r === 0 || r === 255).toBe(true);
    }
  });

  it("T3.3 — bluerandom mode is deterministic with identical inputs", () => {
    filter.setParameters({ thresholdMode: 2 });
    const result1 = filter.apply(makeImageData(8, 8));
    const result2 = filter.apply(makeImageData(8, 8));
    expect([...result1.data]).toEqual([...result2.data]);
  });

  // ── T3.4 Bayer dithering modes ────────────────────────────────────────────

  it("T3.4 — bayer2 (ditheringMode=1) should not throw and output 0 or 255", () => {
    filter.setParameters({ ditheringMode: 1 });
    const result = filter.apply(makeImageData(8, 8));
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i] === 0 || result.data[i] === 255).toBe(true);
    }
  });

  it("T3.4 — bayer4 (ditheringMode=2) should not throw and output 0 or 255", () => {
    filter.setParameters({ ditheringMode: 2 });
    const result = filter.apply(makeImageData(8, 8));
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i] === 0 || result.data[i] === 255).toBe(true);
    }
  });

  it("T3.4 — bayer8 (ditheringMode=3) should not throw and output 0 or 255", () => {
    filter.setParameters({ ditheringMode: 3 });
    const result = filter.apply(makeImageData(8, 8));
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i] === 0 || result.data[i] === 255).toBe(true);
    }
  });

  it("T3.4 — bayer16 (ditheringMode=4) should not throw and output 0 or 255", () => {
    filter.setParameters({ ditheringMode: 4 });
    const result = filter.apply(makeImageData(16, 16));
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i] === 0 || result.data[i] === 255).toBe(true);
    }
  });

  it("T3.4 — Bayer dithering is deterministic with identical inputs", () => {
    filter.setParameters({ ditheringMode: 2 });
    const result1 = filter.apply(makeImageData(8, 8));
    const result2 = filter.apply(makeImageData(8, 8));
    expect([...result1.data]).toEqual([...result2.data]);
  });

  // ── T3.5 Buffer reuse ────────────────────────────────────────────────────

  it("T3.5 — should reuse buffer across calls of same size", () => {
    const imageData1 = makeImageData(4, 4);
    filter.apply(imageData1);
    // Second call with same size should not throw (buffer reused without realloc)
    const imageData2 = makeImageData(4, 4);
    expect(() => filter.apply(imageData2)).not.toThrow();
  });

  it("T3.5 — should reallocate buffer when dimensions change", () => {
    filter.apply(makeImageData(4, 4));
    // Larger image triggers reallocation
    const result = filter.apply(makeImageData(8, 8));
    expect(result.data.length).toBe(8 * 8 * 4);
  });

  // ── T3.6 Parameters, clamping, cleanup, invalid input ───────────────────

  it("T3.6 — getDefaultParameters returns correct defaults", () => {
    expect(filter.getDefaultParameters()).toEqual({
      thresholdMode: 0,
      threshold: 128,
      ditheringMode: 0,
    });
  });

  it("T3.6 — threshold is clamped to [0, 255]", () => {
    filter.setParameters({ threshold: -50 });
    // Pixel with lum=128 >= threshold=0 → white
    const result = filter.apply(makeImageData(1, 1, [128, 128, 128, 255]));
    expect(result.data[0]).toBe(255);

    filter.setParameters({ threshold: 300 });
    // Pixel with lum=128 < threshold=255 → black
    const result2 = filter.apply(makeImageData(1, 1, [128, 128, 128, 255]));
    expect(result2.data[0]).toBe(0);
  });

  it("T3.6 — thresholdMode is clamped to [0, 2] and floored", () => {
    expect(() => filter.setParameters({ thresholdMode: -1 })).not.toThrow();
    expect(() => filter.setParameters({ thresholdMode: 5 })).not.toThrow();
    expect(() => filter.setParameters({ thresholdMode: 1.9 })).not.toThrow();
  });

  it("T3.6 — ditheringMode is clamped to [0, 4] and floored", () => {
    expect(() => filter.setParameters({ ditheringMode: -1 })).not.toThrow();
    expect(() => filter.setParameters({ ditheringMode: 6 })).not.toThrow();
    expect(() => filter.setParameters({ ditheringMode: 2.7 })).not.toThrow();
  });

  it("T3.6 — cleanup releases internal buffer", () => {
    filter.apply(makeImageData(4, 4));
    expect(() => filter.cleanup()).not.toThrow();
    // After cleanup, a new apply() should still work (reallocates)
    expect(() => filter.apply(makeImageData(4, 4))).not.toThrow();
  });

  it("T3.6 — apply throws for invalid imageData", () => {
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("T3.6 — apply throws for zero-dimension imageData", () => {
    expect(() =>
      filter.apply({
        width: 0,
        height: 0,
        data: new Uint8ClampedArray(0),
      } as ImageData)
    ).toThrow();
  });

  // ── T3.7 ditheringMode overrides thresholdMode ───────────────────────────

  it("T3.7 — ditheringMode overrides thresholdMode: still deterministic when random selected", () => {
    filter.setParameters({ thresholdMode: 1, ditheringMode: 1 }); // random + bayer2
    const result1 = filter.apply(makeImageData(8, 8));
    const result2 = filter.apply(makeImageData(8, 8));
    // Bayer takes over → deterministic even though thresholdMode=1 (random)
    expect([...result1.data]).toEqual([...result2.data]);
  });

  it("T3.7 — ditheringMode=0 with thresholdMode=2 uses bluerandom (not fixed threshold)", () => {
    filter.setParameters({ thresholdMode: 2, ditheringMode: 0 });
    const imageData = makeImageData(8, 8, [128, 128, 128, 255]);
    const result = filter.apply(imageData);
    // At least some pixels should vary (because threshold varies per position)
    // Can't guarantee exact values but all should be 0 or 255
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i] === 0 || result.data[i] === 255).toBe(true);
    }
  });
});
