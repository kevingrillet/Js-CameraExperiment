/**
 * EdgeDetectionFilter - Detects edges using Sobel operator
 * Black background with white edges
 */

import { Filter } from "./Filter";

export class EdgeDetectionFilter implements Filter {
  private readonly EDGE_THRESHOLD = 50; // Threshold for edge visibility

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Create a copy for edge detection calculations
    const originalData = new Uint8ClampedArray(data);

    // Process each pixel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Calculate Sobel gradients
        const gx = this.getSobelX(originalData, x, y, width);
        const gy = this.getSobelY(originalData, x, y, width);

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

    return imageData;
  }

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
}
