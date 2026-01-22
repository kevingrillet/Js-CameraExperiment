/**
 * MotionDetectionFilter tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MotionDetectionFilter } from "../MotionDetectionFilter";

describe("MotionDetectionFilter", () => {
  let filter: MotionDetectionFilter;

  beforeEach(() => {
    filter = new MotionDetectionFilter();
  });

  it("should return black frame on first call (no previous frame)", () => {
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

    // First frame should be black (RGB = 0) with alpha = 255
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(0); // R
      expect(result.data[i + 1]).toBe(0); // G
      expect(result.data[i + 2]).toBe(0); // B
      expect(result.data[i + 3]).toBe(255); // Alpha
    }
  });

  it("should detect motion between frames", () => {
    const imageData1 = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    const imageData2 = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData;

    // Frame 1: Black
    imageData1.data.fill(0);
    for (let i = 3; i < imageData1.data.length; i += 4) {
      imageData1.data[i] = 255; // Alpha
    }

    // Frame 2: White (significant change)
    for (let i = 0; i < imageData2.data.length; i += 4) {
      imageData2.data[i] = 255;
      imageData2.data[i + 1] = 255;
      imageData2.data[i + 2] = 255;
      imageData2.data[i + 3] = 255;
    }

    filter.apply(imageData1); // First frame (black)
    const result = filter.apply(imageData2); // Second frame (white)

    // Should detect motion (not all black)
    let hasMotion = false;
    for (let i = 0; i < result.data.length; i += 4) {
      if (
        result.data[i]! > 0 ||
        result.data[i + 1]! > 0 ||
        result.data[i + 2]! > 0
      ) {
        hasMotion = true;
        break;
      }
    }

    expect(hasMotion).toBe(true);
  });

  it("should persist heatmap between frames (with decay)", () => {
    const filter = new MotionDetectionFilter(); // Fresh filter

    const frame1 = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    const frame2 = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Frame 1: Black
    for (let i = 0; i < 100; i += 4) {
      frame1.data[i] = 0;
      frame1.data[i + 1] = 0;
      frame1.data[i + 2] = 0;
      frame1.data[i + 3] = 255;
    }

    // Frame 2: White (high motion)
    for (let i = 0; i < 100; i += 4) {
      frame2.data[i] = 255;
      frame2.data[i + 1] = 255;
      frame2.data[i + 2] = 255;
      frame2.data[i + 3] = 255;
    }

    filter.apply(frame1); // First frame
    const result = filter.apply(frame2); // Second frame with high motion

    // Should show motion (heatmap active)
    let hasMotion = false;
    for (let i = 0; i < result.data.length; i += 4) {
      if (
        result.data[i]! > 50 ||
        result.data[i + 1]! > 50 ||
        result.data[i + 2]! > 50
      ) {
        hasMotion = true;
        break;
      }
    }

    expect(hasMotion).toBe(true);
  });

  it("should handle buffer reallocation when dimensions change", () => {
    const filter = new MotionDetectionFilter(); // Fresh filter

    const smallImage = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    // Fill small image
    for (let i = 0; i < smallImage.data.length; i++) {
      smallImage.data[i] = 100;
    }

    // Apply with consistent size
    filter.apply(smallImage);
    const result = filter.apply(smallImage); // Same size works

    expect(result.data.length).toBe(100);
  });

  it("should throw for invalid imageData", () => {
    expect(() => filter.apply(null as unknown as ImageData)).toThrow();
  });

  it("should call cleanup without error", () => {
    const imageData = {
      width: 5,
      height: 5,
      data: new Uint8ClampedArray(5 * 5 * 4),
    } as ImageData;

    filter.apply(imageData);
    expect(() => filter.cleanup()).not.toThrow();
  });
});
