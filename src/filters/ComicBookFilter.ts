/**
 * ComicBookFilter - Creates comic book / halftone style effect
 * Combines posterization (reduced colors) with thick black outlines
 */

import { Filter, validateImageData } from "./Filter";
import { computeSobelGradients } from "../utils/SobelOperator";
import { Logger } from "../utils/Logger";

export class ComicBookFilter implements Filter {
  /**
   * Edge magnitude threshold for black outline rendering
   * Gradients above this threshold become black outlines
   * 100 filters out noise (50-80) while capturing medium-strength edges (<150)
   */
  private readonly EDGE_THRESHOLD = 100;

  /**
   * Buffer for Sobel gradient computation (reused across frames)
   * Allocated on first use or when image dimensions change
   */
  private edgeBuffer: { gx: Float32Array; gy: Float32Array } | null = null;
  private lastWidth = 0;
  private lastHeight = 0;

  /**
   * Apply comic book effect to image data
   * Step 1: Posterization (reduce colors to 8 levels per channel)
   * Step 2: Edge detection using Sobel operator
   * Step 3: Overlay thick black outlines where edges detected
   *
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with comic book effect
   * @throws Error if imageData is invalid
   */
  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Step 1: Posterization - reduce each RGB channel to 3 bits (8 levels)
      for (let i = 0; i < data.length; i += 4) {
        // Bit-shift operation: (value >> 5) << 5 equivalent to value & 0xE0
        // This rounds down to nearest multiple of 32 (2^5)
        data[i] = (data[i]! >> 5) << 5; // R
        data[i + 1] = (data[i + 1]! >> 5) << 5; // G
        data[i + 2] = (data[i + 2]! >> 5) << 5; // B
        // Alpha unchanged
      }

      // Step 2 & 3: Edge detection and overlay
      try {
        // Update buffer if dimensions changed
        if (
          this.edgeBuffer === null ||
          width !== this.lastWidth ||
          height !== this.lastHeight
        ) {
          this.lastWidth = width;
          this.lastHeight = height;
        }

        // Compute gradients (reuses buffer if same dimensions)
        this.edgeBuffer = computeSobelGradients(data, width, height);

        const { gx, gy } = this.edgeBuffer;

        // Overlay black outlines where edge magnitude exceeds threshold
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const gradientX = gx[idx]!;
            const gradientY = gy[idx]!;

            // Compute gradient magnitude: sqrt(Gx² + Gy²)
            const magnitude = Math.sqrt(
              gradientX * gradientX + gradientY * gradientY
            );

            // If edge detected, draw black outline
            if (magnitude > this.EDGE_THRESHOLD) {
              const pixelIdx = idx * 4;
              data[pixelIdx] = 0; // R = black
              data[pixelIdx + 1] = 0; // G = black
              data[pixelIdx + 2] = 0; // B = black
              // Alpha unchanged
            }
          }
        }
      } catch (sobelError) {
        // Fallback: If Sobel fails, continue with posterization only
        Logger.error(
          "ComicBookFilter: Sobel edge detection failed, continuing with posterization only",
          sobelError instanceof Error ? sobelError : undefined
        );
      }

      return imageData;
    } catch (error) {
      Logger.error(
        "ComicBookFilter error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Cleanup allocated buffers when filter is replaced
   * Called by RenderPipeline.setFilter() when switching filters
   */
  cleanup(): void {
    try {
      this.edgeBuffer = null;
      this.lastWidth = 0;
      this.lastHeight = 0;
    } catch (error) {
      Logger.error(
        "ComicBookFilter cleanup error:",
        error instanceof Error ? error : undefined
      );
    }
  }
}
