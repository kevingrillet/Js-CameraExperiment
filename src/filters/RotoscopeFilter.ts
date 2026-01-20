/**
 * RotoscopeFilter - Creates a cartoon/rotoscope animation effect
 * Reduces colors and adds edge detection for an animated look
 */

import { Filter } from "./Filter";

export class RotoscopeFilter implements Filter {
  private readonly COLOR_LEVELS = 6; // Number of color levels per channel
  private readonly EDGE_THRESHOLD = 30; // Threshold for edge detection
  private readonly EDGE_STRENGTH = 0.8; // How strong the edges appear

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Create a copy for edge detection
    const originalData = new Uint8ClampedArray(data);

    // Step 1: Posterize colors (reduce color palette)
    this.posterize(data);

    // Step 2: Detect and draw edges
    this.addEdges(data, originalData, width, height);

    return imageData;
  }

  private posterize(data: Uint8ClampedArray): void {
    const step = 256 / this.COLOR_LEVELS;

    for (let i = 0; i < data.length; i += 4) {
      // Quantize each color channel to reduce palette
      data[i] = Math.floor(data[i]! / step) * step; // Red
      data[i + 1] = Math.floor(data[i + 1]! / step) * step; // Green
      data[i + 2] = Math.floor(data[i + 2]! / step) * step; // Blue
    }
  }

  private addEdges(
    data: Uint8ClampedArray,
    originalData: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    // Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Get surrounding pixels for Sobel operator
        const gx = this.getSobelX(originalData, x, y, width);
        const gy = this.getSobelY(originalData, x, y, width);

        // Calculate gradient magnitude
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        // If edge detected, darken the pixel
        if (magnitude > this.EDGE_THRESHOLD) {
          const darken = 1 - this.EDGE_STRENGTH * (magnitude / 255);
          data[idx] = data[idx]! * darken;
          data[idx + 1] = data[idx + 1]! * darken;
          data[idx + 2] = data[idx + 2]! * darken;
        }
      }
    }
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

    const topLeft = this.getGrayscale(data, ((y - 1) * width + (x - 1)) * 4);
    const topRight = this.getGrayscale(data, ((y - 1) * width + (x + 1)) * 4);
    const midLeft = this.getGrayscale(data, (y * width + (x - 1)) * 4);
    const midRight = this.getGrayscale(data, (y * width + (x + 1)) * 4);
    const bottomLeft = this.getGrayscale(data, ((y + 1) * width + (x - 1)) * 4);
    const bottomRight = this.getGrayscale(
      data,
      ((y + 1) * width + (x + 1)) * 4
    );

    return (
      -topLeft +
      topRight -
      2 * midLeft +
      2 * midRight -
      bottomLeft +
      bottomRight
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

    const topLeft = this.getGrayscale(data, ((y - 1) * width + (x - 1)) * 4);
    const topCenter = this.getGrayscale(data, ((y - 1) * width + x) * 4);
    const topRight = this.getGrayscale(data, ((y - 1) * width + (x + 1)) * 4);
    const bottomLeft = this.getGrayscale(data, ((y + 1) * width + (x - 1)) * 4);
    const bottomCenter = this.getGrayscale(data, ((y + 1) * width + x) * 4);
    const bottomRight = this.getGrayscale(
      data,
      ((y + 1) * width + (x + 1)) * 4
    );

    return (
      -topLeft -
      2 * topCenter -
      topRight +
      bottomLeft +
      2 * bottomCenter +
      bottomRight
    );
  }
}
