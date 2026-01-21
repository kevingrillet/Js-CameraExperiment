/**
 * VHSFilter - Creates a vintage VHS tape effect
 * Random glitches, tracking lines, color bleeding, and grain
 */

import { Filter, validateImageData } from "./Filter";

export class VHSFilter implements Filter {
  private frameCount = 0;
  private rowDataBuffer: Uint8ClampedArray | null = null;

  /**
   * Probability of random glitch per frame (0-1)
   * 0.02 = 2% chance per frame = glitch every ~2 seconds at 30fps
   * Simulates tracking errors and tape damage on VHS
   */
  private readonly GLITCH_PROBABILITY = 0.02;

  /**
   * Probability of horizontal tracking line per frame (0-1)
   * 0.15 = 15% chance = frequent but not constant
   * Mimics VHS head tracking issues and tape wear
   */
  private readonly TRACKING_LINE_PROBABILITY = 0.15;

  /**
   * Intensity of film grain noise (0-1)
   * 0.08 provides subtle grain without overwhelming the image
   * Represents magnetic particle noise on VHS tape
   */
  private readonly GRAIN_INTENSITY = 0.08;

  /**
   * Apply VHS vintage effect to image data
   * Creates glitches, tracking lines, color bleeding, and grain
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with VHS artifacts
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    this.frameCount++;

    // Add random tracking lines (horizontal glitches)
    if (Math.random() < this.TRACKING_LINE_PROBABILITY) {
      this.addTrackingLine(data, width, height);
    }

    // Apply VHS color bleeding and degradation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Add grain/noise
        const grain = (Math.random() - 0.5) * this.GRAIN_INTENSITY * 255;

        // Slightly desaturate and shift colors for VHS look
        const r = data[idx]!;
        const g = data[idx + 1]!;
        const b = data[idx + 2]!;

        // Reduce saturation slightly
        const gray = (r + g + b) / 3;
        const desatFactor = 0.85;

        data[idx] = Math.max(
          0,
          Math.min(255, r * desatFactor + gray * (1 - desatFactor) + grain)
        );
        data[idx + 1] = Math.max(
          0,
          Math.min(255, g * desatFactor + gray * (1 - desatFactor) + grain)
        );
        data[idx + 2] = Math.max(
          0,
          Math.min(255, b * desatFactor + gray * (1 - desatFactor) + grain)
        );

        // Color bleeding - slight horizontal blur on red/blue channels
        if (x > 0) {
          const prevIdx = (y * width + (x - 1)) * 4;
          const currentR = data[idx];
          const currentB = data[idx + 2];
          const prevR = data[prevIdx];
          const prevB = data[prevIdx + 2];
          if (
            currentR !== undefined &&
            prevR !== undefined &&
            currentB !== undefined &&
            prevB !== undefined
          ) {
            data[idx] = currentR * 0.7 + prevR * 0.3; // R bleed from left
            data[idx + 2] = currentB * 0.7 + prevB * 0.3; // B bleed from left
          }
        }
      }
    }

    // Occasional random glitches
    if (Math.random() < this.GLITCH_PROBABILITY) {
      this.addGlitch(data, width, height);
    }

    return imageData;
  }

  private addTrackingLine(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const lineY = Math.floor(Math.random() * height);
    const lineHeight = Math.floor(Math.random() * 3) + 1;

    for (let y = lineY; y < Math.min(lineY + lineHeight, height); y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Add noise to the tracking line
        const noise = Math.random() * 100;
        data[idx] = noise;
        data[idx + 1] = noise;
        data[idx + 2] = noise;
      }
    }
  }

  private addGlitch(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    // Random horizontal shift in a small area
    const glitchY = Math.floor(Math.random() * height);
    const glitchHeight = Math.floor(Math.random() * 20) + 5;
    const shift = Math.floor((Math.random() - 0.5) * 40);

    // Reuse buffer instead of allocating each glitch
    if (this.rowDataBuffer?.length !== width * 4) {
      this.rowDataBuffer = new Uint8ClampedArray(width * 4);
    }

    for (let y = glitchY; y < Math.min(glitchY + glitchHeight, height); y++) {
      const rowData = this.rowDataBuffer;

      // Copy row
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        rowData[x * 4] = data[srcIdx]!;
        rowData[x * 4 + 1] = data[srcIdx + 1]!;
        rowData[x * 4 + 2] = data[srcIdx + 2]!;
        rowData[x * 4 + 3] = data[srcIdx + 3]!;
      }

      // Paste with shift
      for (let x = 0; x < width; x++) {
        const srcX = (x - shift + width) % width;
        const dstIdx = (y * width + x) * 4;
        data[dstIdx] = rowData[srcX * 4]!;
        data[dstIdx + 1] = rowData[srcX * 4 + 1]!;
        data[dstIdx + 2] = rowData[srcX * 4 + 2]!;
      }
    }
  }

  /**
   * Cleanup allocated buffers
   */
  cleanup(): void {
    this.rowDataBuffer = null;
  }
}
