/**
 * DepthOfFieldFilter - Simulates camera depth of field with bokeh effect
 * Center focus zone remains sharp, progressive blur toward edges (bokeh)
 */

import { Filter, validateImageData } from "./Filter";
import { Logger } from "../utils/Logger";

export class DepthOfFieldFilter implements Filter {
  /**
   * Focus zone radius as ratio of minimum dimension (width or height)
   * 0.3 = 30% of min dimension, creating visible focus area (>20%) with room for blur (<40%)
   * Example: 1920×1080 → min=1080, radius=324px (circle diameter ~650px centered)
   */
  private readonly FOCUS_RADIUS_RATIO = 0.3;

  /**
   * Maximum blur kernel size at image edges
   * 9 = strong bokeh effect without severe performance degradation (<20 FPS)
   * Higher values create stronger blur but reduce FPS exponentially
   */
  private readonly MAX_BLUR_KERNEL = 9;

  /**
   * Temporary buffer for blur passes (reused across frames)
   */
  private blurBuffer: Uint8ClampedArray | null = null;

  /**
   * Pre-computed distance map (pixels to focus zone center)
   * Reused if dimensions unchanged, avoiding expensive sqrt() per frame
   */
  private distanceMap: Float32Array | null = null;
  private lastWidth = 0;
  private lastHeight = 0;

  /**
   * Apply depth of field effect to image data
   * Sharp focus in center circle, progressive blur toward edges
   * Uses separable box blur (horizontal then vertical) for performance
   *
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with DoF effect
   * @throws Error if imageData is invalid
   */
  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Validate dimensions
      if (width <= 0 || height <= 0) {
        throw new Error(`Invalid dimensions: ${width}x${height}`);
      }

      // Allocate or reuse blur buffer (for intermediate results)
      const expectedLength = width * height * 4;
      if (this.blurBuffer?.length !== expectedLength) {
        this.blurBuffer = new Uint8ClampedArray(expectedLength);
      }

      // Center coordinates for focus zone
      const centerX = width / 2;
      const centerY = height / 2;

      // Focus zone radius (30% of minimum dimension)
      const focusRadius = Math.min(width, height) * this.FOCUS_RADIUS_RATIO;

      // Maximum distance (corner to center)
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      // Compute or reuse distance map
      if (
        this.distanceMap === null ||
        width !== this.lastWidth ||
        height !== this.lastHeight
      ) {
        this.distanceMap = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // NaN safety check
            this.distanceMap[y * width + x] = isFinite(distance) ? distance : 0;
          }
        }
        this.lastWidth = width;
        this.lastHeight = height;
      }

      // Strategy: Save original, apply blur, then blend based on distance
      // This is O(n*k) instead of O(n³) from per-pixel variable blur

      // Step 1: Save original data to blurBuffer
      this.blurBuffer.set(data);

      // Step 2: Apply maximum blur to entire image (separable box blur)
      this.applySeparableBlur(data, width, height, this.MAX_BLUR_KERNEL);

      // Step 3: Blend blurred version with original based on distance from focus zone
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const distance = this.distanceMap[y * width + x]!;

          // Calculate blend factor (0 = original, 1 = fully blurred)
          let blendFactor = 0;
          if (distance > focusRadius) {
            const normalizedDistance = Math.min(
              1,
              (distance - focusRadius) / (maxDistance - focusRadius)
            );
            blendFactor = normalizedDistance;
          }

          // Blend original (in blurBuffer) with blurred (in data)
          const originalR = this.blurBuffer[idx]!;
          const originalG = this.blurBuffer[idx + 1]!;
          const originalB = this.blurBuffer[idx + 2]!;

          const blurredR = data[idx]!;
          const blurredG = data[idx + 1]!;
          const blurredB = data[idx + 2]!;

          data[idx] = originalR + (blurredR - originalR) * blendFactor;
          data[idx + 1] = originalG + (blurredG - originalG) * blendFactor;
          data[idx + 2] = originalB + (blurredB - originalB) * blendFactor;
          // Alpha unchanged
        }
      }

      return imageData;
    } catch (error) {
      Logger.error(
        "DepthOfFieldFilter error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Apply separable box blur (horizontal then vertical passes)
   * Much more efficient than 2D convolution: O(n*k) instead of O(n*k²)
   * IMPORTANT: Expects original data to be already saved in blurBuffer before calling
   *
   * @param data - Image pixel data (mutated in-place)
   * @param width - Image width
   * @param height - Image height
   * @param kernelSize - Blur kernel size
   */
  private applySeparableBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernelSize: number
  ): void {
    if (kernelSize <= 1 || this.blurBuffer === null) {
      return;
    }

    const radius = Math.floor(kernelSize / 2);

    // Temporary buffer for intermediate horizontal pass result
    const tempBuffer = new Uint8ClampedArray(data.length);

    // Horizontal pass (read from data, write to tempBuffer)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let count = 0;

        for (let kx = -radius; kx <= radius; kx++) {
          const sampleX = Math.max(0, Math.min(width - 1, x + kx));
          const srcIdx = (y * width + sampleX) * 4;

          sumR += data[srcIdx]!;
          sumG += data[srcIdx + 1]!;
          sumB += data[srcIdx + 2]!;
          count++;
        }

        const dstIdx = (y * width + x) * 4;
        tempBuffer[dstIdx] = sumR / count;
        tempBuffer[dstIdx + 1] = sumG / count;
        tempBuffer[dstIdx + 2] = sumB / count;
        tempBuffer[dstIdx + 3] = data[dstIdx + 3]!; // Copy alpha
      }
    }

    // Vertical pass (read from tempBuffer, write back to data)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let count = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          const sampleY = Math.max(0, Math.min(height - 1, y + ky));
          const srcIdx = (sampleY * width + x) * 4;

          sumR += tempBuffer[srcIdx]!;
          sumG += tempBuffer[srcIdx + 1]!;
          sumB += tempBuffer[srcIdx + 2]!;
          count++;
        }

        const dstIdx = (y * width + x) * 4;
        data[dstIdx] = sumR / count;
        data[dstIdx + 1] = sumG / count;
        data[dstIdx + 2] = sumB / count;
        // Alpha unchanged
      }
    }
  }

  /**
   * Cleanup allocated buffers when filter is replaced
   */
  cleanup(): void {
    try {
      this.blurBuffer = null;
      this.distanceMap = null;
      this.lastWidth = 0;
      this.lastHeight = 0;
    } catch (error) {
      Logger.error(
        "DepthOfFieldFilter cleanup error:",
        error instanceof Error ? error : undefined
      );
    }
  }
}
