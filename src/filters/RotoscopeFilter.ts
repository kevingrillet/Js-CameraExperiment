/**
 * RotoscopeFilter - Creates a cartoon/rotoscope animation effect
 * Reduces colors and adds edge detection for an animated look
 */

import { Filter, validateImageData } from "./Filter";
import { computeSobelGradients } from "../utils/SobelOperator";

export class RotoscopeFilter implements Filter {
  /**
   * Number of color levels per RGB channel for posterization
   * Value of 6 creates cartoon-like color banding (6x6x6 = 216 colors)
   * Lower values = more aggressive cartoon effect
   */
  private readonly COLOR_LEVELS = 6;

  /**
   * Edge detection sensitivity threshold (0-255)
   * 30 provides good edge detection without too much noise
   * Lower values = more sensitive, higher values = only strong edges
   */
  private readonly EDGE_THRESHOLD = 30;

  /**
   * Intensity of edge darkening effect (0-1)
   * 0.8 creates strong black outlines for cartoon effect
   * Lower values = lighter edges, higher values = darker edges
   */
  private readonly EDGE_STRENGTH = 0.8;

  /**
   * Feature flag for Sobel utility migration
   * Set to true to use shared SobelOperator utility
   * Set to false to rollback to old inline implementation
   */
  private readonly USE_SOBEL_UTIL = true;

  private edgeBuffer: Uint8ClampedArray | null = null;

  /**
   * Apply rotoscope effect to image data
   * Combines color posterization with edge detection for cartoon-like appearance
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with rotoscope effect
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Create a copy for edge detection - reuse buffer
    if (this.edgeBuffer?.length !== data.length) {
      this.edgeBuffer = new Uint8ClampedArray(data.length);
    }
    this.edgeBuffer.set(data);

    // Step 1: Posterize colors (reduce color palette)
    this.posterize(data);

    // Step 2: Detect and draw edges
    this.addEdges(data, this.edgeBuffer, width, height);

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
    if (this.USE_SOBEL_UTIL) {
      // NEW PATH: Use shared SobelOperator utility
      const { gx, gy } = computeSobelGradients(originalData, width, height);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIdx = y * width + x;
          const byteIdx = pixelIdx * 4;

          // Calculate gradient magnitude
          const magnitude = Math.sqrt(gx[pixelIdx]! ** 2 + gy[pixelIdx]! ** 2);

          // Guard against NaN/Infinity
          const safeMagnitude = isFinite(magnitude) ? magnitude : 0;

          // If edge detected, darken the pixel
          if (safeMagnitude > this.EDGE_THRESHOLD) {
            const darken = 1 - this.EDGE_STRENGTH * (safeMagnitude / 255);
            data[byteIdx] = data[byteIdx]! * darken;
            data[byteIdx + 1] = data[byteIdx + 1]! * darken;
            data[byteIdx + 2] = data[byteIdx + 2]! * darken;
          }
        }
      }
    } else {
      // OLD PATH (ROLLBACK AVAILABLE): Original inline implementation
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

  /**
   * Clean up allocated buffers when filter is replaced
   */
  cleanup(): void {
    this.edgeBuffer = null;
  }
}
