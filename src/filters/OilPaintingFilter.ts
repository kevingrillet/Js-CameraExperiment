/**
 * OilPaintingFilter - Oil painting artistic effect
 * Posterization + simplified edge-preserving blur
 */

import { Filter, validateImageData } from "./Filter";

export class OilPaintingFilter implements Filter {
  /**
   * Number of posterization levels per RGB channel (3 bits)
   * 8 levels provides strong oil painting effect with visible color banding
   * Lower values = more aggressive posterization, may show visible banding
   */
  private readonly POSTERIZE_LEVELS = 8;

  /**
   * Blur kernel size (5x5 = 25 neighbors)
   * Simplified bilateral blur for oil painting effect
   * 5x5 provides stronger artistic blur (trade-off: ~15-20 FPS at 1080p)
   */
  private readonly KERNEL_SIZE = 5;

  /**
   * Color similarity threshold for edge-preserving blur
   * RGB delta < 80 = similar color → include in blur
   * RGB delta >= 80 = edge detected → preserve sharpness
   * Higher threshold = more aggressive blur, stronger oil painting effect
   */
  private readonly COLOR_SIMILARITY_THRESHOLD = 80;

  /**
   * Temporary buffer for blur pass
   * Reused across frames for zero allocations in render loop
   */
  private tempBuffer: Uint8ClampedArray | null = null;

  /**
   * Apply oil painting effect to image data
   * Two-pass: posterize colors, then edge-preserving blur
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with oil painting effect
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Allocate/reuse temp buffer
    if (this.tempBuffer?.length !== data.length) {
      this.tempBuffer = new Uint8ClampedArray(data.length);
    }

    // Pass 1: Posterize colors first (quantize RGB to 32 levels)
    this.tempBuffer.set(data);
    this.posterize(this.tempBuffer);

    // Pass 2: Simplified edge-preserving blur (threshold-based)
    this.edgePreservingBlur(this.tempBuffer, data, width, height);

    return imageData;
  }

  private posterize(data: Uint8ClampedArray): void {
    const step = 256 / this.POSTERIZE_LEVELS;

    for (let i = 0; i < data.length; i += 4) {
      // Quantize each channel to nearest posterization level (clamp to avoid 256)
      data[i] = Math.min(Math.floor(data[i]! / step) * step, 255); // Red
      data[i + 1] = Math.min(Math.floor(data[i + 1]! / step) * step, 255); // Green
      data[i + 2] = Math.min(Math.floor(data[i + 2]! / step) * step, 255); // Blue
      // Alpha unchanged
    }
  }

  private edgePreservingBlur(
    sourceData: Uint8ClampedArray,
    destData: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const halfKernel = Math.floor(this.KERNEL_SIZE / 2);

    // Process each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const centerIdx = (y * width + x) * 4;
        const cR = sourceData[centerIdx]!;
        const cG = sourceData[centerIdx + 1]!;
        const cB = sourceData[centerIdx + 2]!;

        let sumR = 0,
          sumG = 0,
          sumB = 0,
          count = 0;

        // Iterate 3x3 neighborhood
        for (let dy = -halfKernel; dy <= halfKernel; dy++) {
          for (let dx = -halfKernel; dx <= halfKernel; dx++) {
            const ny = y + dy;
            const nx = x + dx;

            // Bounds check
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nIdx = (ny * width + nx) * 4;
              const nR = sourceData[nIdx]!;
              const nG = sourceData[nIdx + 1]!;
              const nB = sourceData[nIdx + 2]!;

              // Calculate RGB delta (Manhattan distance)
              const colorDelta =
                Math.abs(nR - cR) + Math.abs(nG - cG) + Math.abs(nB - cB);

              // Threshold check: include neighbor if similar color
              if (colorDelta < this.COLOR_SIMILARITY_THRESHOLD) {
                sumR += nR;
                sumG += nG;
                sumB += nB;
                count++;
              }
            }
          }
        }

        // Write averaged color (or center if no similar neighbors)
        if (count > 0) {
          destData[centerIdx] = sumR / count;
          destData[centerIdx + 1] = sumG / count;
          destData[centerIdx + 2] = sumB / count;
          destData[centerIdx + 3] = sourceData[centerIdx + 3]!; // Alpha
        } else {
          // No similar neighbors - keep original
          destData[centerIdx] = cR;
          destData[centerIdx + 1] = cG;
          destData[centerIdx + 2] = cB;
          destData[centerIdx + 3] = sourceData[centerIdx + 3]!;
        }
      }
    }
  }

  /**
   * Clean up allocated buffers when filter is replaced
   * Idempotent: safe to call multiple times
   */
  cleanup(): void {
    this.tempBuffer = null;
  }
}
