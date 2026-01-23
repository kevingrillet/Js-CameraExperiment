/**
 * EdgeDetectionFilter - Detects edges using Sobel operator
 * Black background with white edges
 */

import { Filter, validateImageData } from "./Filter";
import { computeSobelGradients } from "../utils/SobelOperator";

export class EdgeDetectionFilter implements Filter {
  /**
   * Edge detection magnitude threshold (0-255)
   * 50 provides clean edge detection with minimal noise
   * Lower values = more edges detected (noisier), higher values = only strongest edges
   */
  private readonly EDGE_THRESHOLD = 50;

  /**
   * Feature flag for Sobel utility migration
   * Set to true to use shared SobelOperator utility
   * Set to false to rollback to old inline implementation
   */
  private readonly USE_SOBEL_UTIL = true;

  private sobelBuffer: Uint8ClampedArray | null = null;

  /**
   * Apply edge detection filter to image data
   * Uses Sobel operator to detect edges, displays as white on black background
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with detected edges
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    if (this.USE_SOBEL_UTIL) {
      // NEW PATH: Use shared SobelOperator utility
      const { gx, gy } = computeSobelGradients(data, width, height);

      // Process each pixel
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIdx = y * width + x;
          const byteIdx = pixelIdx * 4;

          // Calculate gradient magnitude
          const magnitude = Math.sqrt(gx[pixelIdx]! ** 2 + gy[pixelIdx]! ** 2);

          // Guard against NaN/Infinity
          const safeMagnitude = isFinite(magnitude) ? magnitude : 0;

          // Set pixel to white if edge detected, black otherwise
          const edgeValue = safeMagnitude > this.EDGE_THRESHOLD ? 255 : 0;

          data[byteIdx] = edgeValue; // R
          data[byteIdx + 1] = edgeValue; // G
          data[byteIdx + 2] = edgeValue; // B
          // Alpha stays at 255
        }
      }
    } else {
      // OLD PATH (ROLLBACK AVAILABLE): Original inline implementation
      // Create a copy for edge detection calculations - reuse buffer
      if (this.sobelBuffer?.length !== data.length) {
        this.sobelBuffer = new Uint8ClampedArray(data.length);
      }
      this.sobelBuffer.set(data);

      // Process each pixel
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;

          // Calculate Sobel gradients
          const gx = this.getSobelX(this.sobelBuffer, x, y, width);
          const gy = this.getSobelY(this.sobelBuffer, x, y, width);

          // Calculate gradient magnitude
          const magnitude = Math.sqrt(gx * gx + gy * gy);

          // Set pixel to white if edge detected, black otherwise
          const edgeValue = magnitude > this.EDGE_THRESHOLD ? 255 : 0;

          data[idx] = edgeValue; // R
          data[idx + 1] = edgeValue; // G
          data[idx + 2] = edgeValue; // B
          // Alpha stays at 255
        }
      }
    }

    return imageData;
  }

  // ============================================================================
  // OLD IMPLEMENTATION (KEPT FOR ROLLBACK - set USE_SOBEL_UTIL = false)
  // ============================================================================

  private getGrayscale(data: Uint8ClampedArray, idx: number): number {
    return 0.299 * data[idx]! + 0.587 * data[idx + 1]! + 0.114 * data[idx + 2]!;
  }

  private getSobelX(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number
  ): number {
    // Sobel X kernel:
    // -1  0  1
    // -2  0  2
    // -1  0  1

    const idx = (y: number, x: number): number => (y * width + x) * 4;

    return (
      -this.getGrayscale(data, idx(y - 1, x - 1)) +
      this.getGrayscale(data, idx(y - 1, x + 1)) +
      -2 * this.getGrayscale(data, idx(y, x - 1)) +
      2 * this.getGrayscale(data, idx(y, x + 1)) +
      -this.getGrayscale(data, idx(y + 1, x - 1)) +
      this.getGrayscale(data, idx(y + 1, x + 1))
    );
  }

  private getSobelY(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number
  ): number {
    // Sobel Y kernel:
    // -1 -2 -1
    //  0  0  0
    //  1  2  1

    const idx = (y: number, x: number): number => (y * width + x) * 4;

    return (
      -this.getGrayscale(data, idx(y - 1, x - 1)) +
      -2 * this.getGrayscale(data, idx(y - 1, x)) +
      -this.getGrayscale(data, idx(y - 1, x + 1)) +
      this.getGrayscale(data, idx(y + 1, x - 1)) +
      2 * this.getGrayscale(data, idx(y + 1, x)) +
      this.getGrayscale(data, idx(y + 1, x + 1))
    );
  }

  /**
   * Clean up allocated buffers when filter is replaced
   */
  cleanup(): void {
    this.sobelBuffer = null;
  }
}
