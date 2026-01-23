/**
 * SobelRainbowFilter - Edge detection with HSL color mapping by orientation
 * Edges colored by their angle (horizontal=cyan, vertical=magenta, etc.)
 */

import { Filter, validateImageData } from "./Filter";
import { computeSobelGradients } from "../utils/SobelOperator";

export class SobelRainbowFilter implements Filter {
  /**
   * Edge detection magnitude threshold (0-255)
   * 50 provides clean edge detection with minimal noise (same as EdgeDetectionFilter)
   * Edges below threshold are rendered as black background
   */
  private readonly EDGE_THRESHOLD = 50;

  /**
   * Apply Sobel Rainbow effect to image data
   * Detects edges and colors them by orientation (angle → hue mapping)
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with colored edges
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Compute Sobel gradients
    const { gx, gy } = computeSobelGradients(data, width, height);

    // Process each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIdx = y * width + x;
        const byteIdx = pixelIdx * 4;

        // Calculate gradient magnitude and angle
        const gxVal = gx[pixelIdx]!;
        const gyVal = gy[pixelIdx]!;
        const magnitude = Math.sqrt(gxVal ** 2 + gyVal ** 2);

        // Guard against NaN/Infinity
        const safeMagnitude = isFinite(magnitude) ? magnitude : 0;

        if (safeMagnitude > this.EDGE_THRESHOLD) {
          // Edge detected - calculate angle and map to color
          const angle = Math.atan2(gyVal, gxVal);
          const safeAngle = isFinite(angle) ? angle : 0;

          // Map angle [-π, π] to hue [0, 360]
          const hue = ((safeAngle + Math.PI) / (2 * Math.PI)) * 360;

          // Convert HSL(hue, 100%, 50%) to RGB
          const rgb = this.hslToRgb(hue, 1.0, 0.5);

          data[byteIdx] = rgb.r; // Red
          data[byteIdx + 1] = rgb.g; // Green
          data[byteIdx + 2] = rgb.b; // Blue
          // Alpha stays at 255
        } else {
          // No edge - black background
          data[byteIdx] = 0;
          data[byteIdx + 1] = 0;
          data[byteIdx + 2] = 0;
        }
      }
    }

    return imageData;
  }

  /**
   * Convert HSL color to RGB
   * Full implementation with proper hue sectoring
   *
   * @param h - Hue in degrees [0, 360]
   * @param s - Saturation [0, 1]
   * @param l - Lightness [0, 1]
   * @returns RGB object with values [0, 255]
   */
  private hslToRgb(
    h: number,
    s: number,
    l: number
  ): { r: number; g: number; b: number } {
    // Chroma calculation
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    // Hue sector mapping
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (h >= 300 && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    // Convert to [0, 255] range
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  /**
   * No buffers to clean up - Sobel utility manages its own allocations
   */
  cleanup(): void {
    // No-op: no buffers to release
  }
}
