/**
 * Filter validation tests
 */

import { describe, it, expect } from "vitest";
import { validateImageData } from "../Filter";

describe("validateImageData", () => {
  it("should throw for null imageData", () => {
    expect(() => validateImageData(null as unknown as ImageData)).toThrow(
      "ImageData is null or undefined"
    );
  });

  it("should throw for undefined imageData", () => {
    expect(() => validateImageData(undefined as unknown as ImageData)).toThrow(
      "ImageData is null or undefined"
    );
  });

  it("should throw for zero width", () => {
    const mockImageData = {
      width: 0,
      height: 10,
      data: new Uint8ClampedArray(0),
    } as ImageData;

    expect(() => validateImageData(mockImageData)).toThrow(
      "Invalid ImageData dimensions"
    );
  });

  it("should throw for zero height", () => {
    const mockImageData = {
      width: 10,
      height: 0,
      data: new Uint8ClampedArray(0),
    } as ImageData;

    expect(() => validateImageData(mockImageData)).toThrow(
      "Invalid ImageData dimensions"
    );
  });

  it("should throw for empty data array", () => {
    const mockImageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(0),
    } as ImageData;

    expect(() => validateImageData(mockImageData)).toThrow(
      "ImageData has no pixel data"
    );
  });

  it("should throw for mismatched data length", () => {
    const mockImageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(100), // Should be 400 (10*10*4)
    } as ImageData;

    expect(() => validateImageData(mockImageData)).toThrow(
      "ImageData size mismatch"
    );
  });

  it("should pass for valid ImageData", () => {
    const mockImageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(400), // 10*10*4 = 400
    } as ImageData;

    expect(() => validateImageData(mockImageData)).not.toThrow();
  });
});
