/**
 * NoneFilter tests
 */

import { describe, it, expect } from "vitest";
import { NoneFilter } from "../NoneFilter";

describe("NoneFilter", () => {
  it("should return imageData unchanged", () => {
    const filter = new NoneFilter();

    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill with test pattern
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 100;
      imageData.data[i + 1] = 150;
      imageData.data[i + 2] = 200;
      imageData.data[i + 3] = 255;
    }

    const original = new Uint8ClampedArray(imageData.data);
    const result = filter.apply(imageData);

    // Data should be identical
    expect(result.data).toEqual(original);
  });

  it("should throw for invalid imageData", () => {
    const filter = new NoneFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should preserve all pixel values exactly", () => {
    const filter = new NoneFilter();

    const imageData = {
      width: 3,
      height: 3,
      data: new Uint8ClampedArray([
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 128, 128, 128, 255, 64,
        192, 32, 255, 200, 100, 50, 255, 10, 20, 30, 255, 240, 160, 80, 255, 50,
        75, 100, 255,
      ]),
    } as ImageData;

    const original = new Uint8ClampedArray(imageData.data);
    filter.apply(imageData);

    expect(imageData.data).toEqual(original);
  });
});
