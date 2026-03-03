/**
 * CRTFilter - Creates a CRT (Cathode Ray Tube) screen effect
 * Adds scanlines and subtle bloom effect
 */

import { Filter, validateImageData } from "./Filter";

export class CRTFilter implements Filter {
  /**
   * Darkness of horizontal scanlines (0.0-1.0)
   * Default: 0.3 provides visible scanlines without being too harsh
   * Mimics the shadow mask effect of CRT phosphor arrangement
   */
  private scanlineDarkness = 0.3;

  /**
   * Spacing between scanlines in pixels (1-6)
   * Default: 2 matches the typical phosphor triad spacing on vintage CRTs
   * Lower values = more scanlines (slower), higher values = less visible effect
   */
  private scanlineSpacing = 2;

  /**
   * Intensity of bloom/glow effect (0.0-0.5)
   * Default: 0.15 provides subtle glow without washing out the image
   * Simulates the electron beam bloom on CRT phosphors
   */
  private bloomIntensity = 0.15;

  private bloomBuffer: Uint8ClampedArray | null = null;

  /**
   * Apply CRT filter effect to image data
   * Creates scanlines and subtle bloom to simulate cathode ray tube display
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with CRT effect
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // First pass: Add subtle bloom by blending with slightly brighter version
    // Reuse buffer to avoid allocation in render loop
    if (this.bloomBuffer?.length !== data.length) {
      this.bloomBuffer = new Uint8ClampedArray(data.length);
    }
    this.bloomBuffer.set(data);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;

      // Brighten for bloom effect
      const bloomR = Math.min(255, r * (1 + this.bloomIntensity));
      const bloomG = Math.min(255, g * (1 + this.bloomIntensity));
      const bloomB = Math.min(255, b * (1 + this.bloomIntensity));

      this.bloomBuffer[i] = bloomR;
      this.bloomBuffer[i + 1] = bloomG;
      this.bloomBuffer[i + 2] = bloomB;
    }

    // Second pass: Apply bloom and scanlines
    for (let y = 0; y < height; y++) {
      const isScanline = y % this.scanlineSpacing === 0;

      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Blend original with bloom
        const originalR = data[idx]!;
        const originalG = data[idx + 1]!;
        const originalB = data[idx + 2]!;

        const bloomR = this.bloomBuffer[idx]!;
        const bloomG = this.bloomBuffer[idx + 1]!;
        const bloomB = this.bloomBuffer[idx + 2]!;

        let r =
          originalR * (1 - this.bloomIntensity) + bloomR * this.bloomIntensity;
        let g =
          originalG * (1 - this.bloomIntensity) + bloomG * this.bloomIntensity;
        let b =
          originalB * (1 - this.bloomIntensity) + bloomB * this.bloomIntensity;

        // Apply scanline darkening
        if (isScanline) {
          r *= 1 - this.scanlineDarkness;
          g *= 1 - this.scanlineDarkness;
          b *= 1 - this.scanlineDarkness;
        }

        data[idx] = Math.min(255, r);
        data[idx + 1] = Math.min(255, g);
        data[idx + 2] = Math.min(255, b);
        data[idx + 3] = 255;
      }
    }

    return imageData;
  }

  /**
   * Update filter parameters at runtime
   */
  setParameters(params: Record<string, number>): void {
    if (params["scanlineDarkness"] !== undefined) {
      this.scanlineDarkness = Math.max(
        0,
        Math.min(1, params["scanlineDarkness"])
      );
    }
    if (params["scanlineSpacing"] !== undefined) {
      this.scanlineSpacing = Math.max(
        1,
        Math.min(6, Math.round(params["scanlineSpacing"]))
      );
    }
    if (params["bloomIntensity"] !== undefined) {
      this.bloomIntensity = Math.max(
        0,
        Math.min(0.5, params["bloomIntensity"])
      );
    }
  }

  /**
   * Get default parameter values
   */
  getDefaultParameters(): Record<string, number> {
    return {
      scanlineDarkness: 0.3,
      scanlineSpacing: 2,
      bloomIntensity: 0.15,
    };
  }

  /**
   * Clean up allocated buffers when filter is replaced
   */
  cleanup(): void {
    this.bloomBuffer = null;
  }
}
