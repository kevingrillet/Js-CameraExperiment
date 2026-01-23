/**
 * Tests for SobelOperator utility
 */

import { describe, it, expect } from "vitest";
import { computeSobelGradients } from "../SobelOperator";

describe("SobelOperator", () => {
  it("should compute high Gx for vertical edge", () => {
    // Create 10x10 image: left half black, right half white
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = x < 5 ? 0 : 255;
        data[idx] = value; // R
        data[idx + 1] = value; // G
        data[idx + 2] = value; // B
        data[idx + 3] = 255; // A
      }
    }

    const { gx, gy } = computeSobelGradients(data, width, height);

    // Check center pixel (5, 5) - right at the edge
    const centerIdx = 5 * width + 5;
    const gxValue = Math.abs(gx[centerIdx]!);
    const gyValue = Math.abs(gy[centerIdx]!);

    // Vertical edge should have high Gx, low Gy
    expect(gxValue).toBeGreaterThan(100);
    expect(gyValue).toBeLessThan(20);
  });

  it("should compute high Gy for horizontal edge", () => {
    // Create 10x10 image: top half black, bottom half white
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = y < 5 ? 0 : 255;
        data[idx] = value; // R
        data[idx + 1] = value; // G
        data[idx + 2] = value; // B
        data[idx + 3] = 255; // A
      }
    }

    const { gx, gy } = computeSobelGradients(data, width, height);

    // Check center pixel (5, 5) - right at the edge
    const centerIdx = 5 * width + 5;
    const gxValue = Math.abs(gx[centerIdx]!);
    const gyValue = Math.abs(gy[centerIdx]!);

    // Horizontal edge should have low Gx, high Gy
    expect(gxValue).toBeLessThan(20);
    expect(gyValue).toBeGreaterThan(100);
  });

  it("should compute non-zero gradients for diagonal edge", () => {
    // Create 10x10 image with diagonal pattern
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = x > y ? 255 : 0;
        data[idx] = value; // R
        data[idx + 1] = value; // G
        data[idx + 2] = value; // B
        data[idx + 3] = 255; // A
      }
    }

    const { gx, gy } = computeSobelGradients(data, width, height);

    // Check center pixel (5, 5) - diagonal should have both Gx and Gy
    const centerIdx = 5 * width + 5;
    const gxValue = Math.abs(gx[centerIdx]!);
    const gyValue = Math.abs(gy[centerIdx]!);

    // Both gradients should be non-zero for diagonal edge
    expect(gxValue).toBeGreaterThan(10);
    expect(gyValue).toBeGreaterThan(10);
  });

  it("should return correct array dimensions", () => {
    const width = 20;
    const height = 15;
    const data = new Uint8ClampedArray(width * height * 4);

    const { gx, gy } = computeSobelGradients(data, width, height);

    expect(gx.length).toBe(width * height);
    expect(gy.length).toBe(width * height);
  });

  it("should compute near-zero gradients for uniform image", () => {
    // All black image
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    // Fill with black (already 0, but explicit)
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 255; // Alpha
    }

    const { gx, gy } = computeSobelGradients(data, width, height);

    // Center pixel should have ~0 gradients (no edges)
    const centerIdx = 5 * width + 5;
    const gxValue = Math.abs(gx[centerIdx]!);
    const gyValue = Math.abs(gy[centerIdx]!);

    expect(gxValue).toBeLessThan(1);
    expect(gyValue).toBeLessThan(1);
  });

  it("should handle extreme values without NaN/Infinity (F8 edge case)", () => {
    // Create 10x10 all-white image (extreme case)
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    // Fill with max white
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }

    const { gx, gy } = computeSobelGradients(data, width, height);

    // Verify no NaN or Infinity in output
    for (let i = 0; i < gx.length; i++) {
      expect(isFinite(gx[i]!)).toBe(true);
      expect(isFinite(gy[i]!)).toBe(true);
      expect(isNaN(gx[i]!)).toBe(false);
      expect(isNaN(gy[i]!)).toBe(false);
    }
  });
});
