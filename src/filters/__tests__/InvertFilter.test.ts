/**
 * InvertFilter tests
 */

import { describe, it, expect } from "vitest";
import { InvertFilter } from "../InvertFilter";

describe("InvertFilter", () => {
  it("should invert colors correctly", () => {
    const filter = new InvertFilter();

    // Create mock ImageData
    const imageData = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray(8), // 2 pixels * 4 channels
    } as ImageData;

    // Set first pixel to red (255, 0, 0, 255)
    imageData.data[0] = 255;
    imageData.data[1] = 0;
    imageData.data[2] = 0;
    imageData.data[3] = 255;

    // Set second pixel to green (0, 255, 0, 255)
    imageData.data[4] = 0;
    imageData.data[5] = 255;
    imageData.data[6] = 0;
    imageData.data[7] = 255;

    const result = filter.apply(imageData);

    // First pixel should be cyan (0, 255, 255, 255)
    expect(result.data[0]).toBe(0);
    expect(result.data[1]).toBe(255);
    expect(result.data[2]).toBe(255);
    expect(result.data[3]).toBe(255);

    // Second pixel should be magenta (255, 0, 255, 255)
    expect(result.data[4]).toBe(255);
    expect(result.data[5]).toBe(0);
    expect(result.data[6]).toBe(255);
    expect(result.data[7]).toBe(255);
  });

  it("should throw for invalid imageData", () => {
    const filter = new InvertFilter();
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });
});
