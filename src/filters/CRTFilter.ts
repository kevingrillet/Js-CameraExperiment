/**
 * CRTFilter - Creates a CRT (Cathode Ray Tube) screen effect
 * Adds scanlines and subtle bloom effect
 */

import { Filter } from "./Filter";

export class CRTFilter implements Filter {
  private readonly SCANLINE_INTENSITY = 0.3; // Darkness of scanlines (0-1)
  private readonly SCANLINE_SPACING = 3; // Pixels between scanlines
  private readonly BLOOM_AMOUNT = 0.15; // Subtle bloom/glow effect

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // First pass: Add subtle bloom by blending with slightly brighter version
    const bloomData = new Uint8ClampedArray(data);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;

      // Brighten for bloom effect
      const bloomR = Math.min(255, r * (1 + this.BLOOM_AMOUNT));
      const bloomG = Math.min(255, g * (1 + this.BLOOM_AMOUNT));
      const bloomB = Math.min(255, b * (1 + this.BLOOM_AMOUNT));

      bloomData[i] = bloomR;
      bloomData[i + 1] = bloomG;
      bloomData[i + 2] = bloomB;
    }

    // Second pass: Apply bloom and scanlines
    for (let y = 0; y < height; y++) {
      const isScanline = y % this.SCANLINE_SPACING === 0;

      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Blend original with bloom
        const originalR = data[idx]!;
        const originalG = data[idx + 1]!;
        const originalB = data[idx + 2]!;

        const bloomR = bloomData[idx]!;
        const bloomG = bloomData[idx + 1]!;
        const bloomB = bloomData[idx + 2]!;

        let r =
          originalR * (1 - this.BLOOM_AMOUNT) + bloomR * this.BLOOM_AMOUNT;
        let g =
          originalG * (1 - this.BLOOM_AMOUNT) + bloomG * this.BLOOM_AMOUNT;
        let b =
          originalB * (1 - this.BLOOM_AMOUNT) + bloomB * this.BLOOM_AMOUNT;

        // Apply scanline darkening
        if (isScanline) {
          r *= 1 - this.SCANLINE_INTENSITY;
          g *= 1 - this.SCANLINE_INTENSITY;
          b *= 1 - this.SCANLINE_INTENSITY;
        }

        data[idx] = Math.min(255, r);
        data[idx + 1] = Math.min(255, g);
        data[idx + 2] = Math.min(255, b);
        data[idx + 3] = 255;
      }
    }

    return imageData;
  }
}
