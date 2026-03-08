/**
 * BlackWhiteFilter — Pure Black & White with threshold, random, blue-noise,
 * and Bayer ordered dithering
 */

import { Filter, validateImageData } from "./Filter";

export class BlackWhiteFilter implements Filter {
  private thresholdMode = 0; // 0=amount | 1=random | 2=bluerandom
  private threshold = 128; // 0–255
  private ditheringMode = 0; // 0=none | 1=bayer2 | 2=bayer4 | 3=bayer8 | 4=bayer16

  private originalDataBuffer: Uint8ClampedArray | null = null;

  // Normalised to [0, 1) — do NOT normalise again in the pixel loop
  private readonly BAYER_2: readonly number[] = [0, 2, 3, 1].map((v) => v / 4);
  private readonly BAYER_4: readonly number[] = [
    0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
  ].map((v) => v / 16);
  private readonly BAYER_8: readonly number[] = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
    14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55,
    23, 61, 29, 53, 21,
  ].map((v) => v / 64);
  private readonly BAYER_16: readonly number[] = [
    0, 128, 32, 160, 8, 136, 40, 168, 2, 130, 34, 162, 10, 138, 42, 170, 192,
    64, 224, 96, 200, 72, 232, 104, 194, 66, 226, 98, 202, 74, 234, 106, 48,
    176, 16, 144, 56, 184, 24, 152, 50, 178, 18, 146, 58, 186, 26, 154, 240,
    112, 208, 80, 248, 120, 216, 88, 242, 114, 210, 82, 250, 122, 218, 90, 12,
    140, 44, 172, 4, 132, 36, 164, 14, 142, 46, 174, 6, 134, 38, 166, 204, 76,
    236, 108, 196, 68, 228, 100, 206, 78, 238, 110, 198, 70, 230, 102, 60, 188,
    28, 156, 52, 180, 20, 148, 62, 190, 30, 158, 54, 182, 22, 150, 252, 124,
    220, 92, 244, 116, 212, 84, 254, 126, 222, 94, 246, 118, 214, 86, 3, 131,
    35, 163, 11, 139, 43, 171, 1, 129, 33, 161, 9, 137, 41, 169, 195, 67, 227,
    99, 203, 75, 235, 107, 193, 65, 225, 97, 201, 73, 233, 105, 51, 179, 19,
    147, 59, 187, 27, 155, 49, 177, 17, 145, 57, 185, 25, 153, 243, 115, 211,
    83, 251, 123, 219, 91, 241, 113, 209, 81, 249, 121, 217, 89, 15, 143, 47,
    175, 7, 135, 39, 167, 13, 141, 45, 173, 5, 133, 37, 165, 207, 79, 239, 111,
    199, 71, 231, 103, 205, 77, 237, 109, 197, 69, 229, 101, 63, 191, 31, 159,
    55, 183, 23, 151, 61, 189, 29, 157, 53, 181, 21, 149, 255, 127, 223, 95,
    247, 119, 215, 87, 253, 125, 221, 93, 245, 117, 213, 85,
  ].map((v) => v / 256);

  private readonly blueNoiseMatrix: ReadonlyArray<ReadonlyArray<number>>;

  constructor() {
    this.blueNoiseMatrix = this.generateBlueNoiseMatrix();
  }

  /**
   * Generate a fixed-seed 64×64 LCG blue-noise matrix, normalised to [0, 1)
   */
  private generateBlueNoiseMatrix(): ReadonlyArray<ReadonlyArray<number>> {
    const SIZE = 64;
    const A = 1664525,
      C = 1013904223,
      M = 4294967296; // standard LCG
    let state = 0x12345678; // fixed seed — reproducible, no Math.random()
    return Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => {
        state = (A * state + C) >>> 0; // force 32-bit unsigned
        return state / M; // normalize to [0, 1)
      })
    );
  }

  /**
   * Return the Bayer matrix and its side length for a given ditheringMode
   */
  private getBayerMatrix(mode: number): {
    matrix: readonly number[];
    size: number;
  } {
    if (mode === 1) {
      return { matrix: this.BAYER_2, size: 2 };
    }
    if (mode === 2) {
      return { matrix: this.BAYER_4, size: 4 };
    }
    if (mode === 3) {
      return { matrix: this.BAYER_8, size: 8 };
    }
    return { matrix: this.BAYER_16, size: 16 };
  }

  /**
   * Apply the black & white filter to the given ImageData
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData (in-place)
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);

    const { data, width } = imageData;

    // Reallocate only when data size changes (zero allocation in steady state)
    if (this.originalDataBuffer?.length !== data.length) {
      this.originalDataBuffer = new Uint8ClampedArray(data.length);
    }
    const buf = this.originalDataBuffer; // TypeScript narrows to Uint8ClampedArray here
    buf.set(data);

    for (let i = 0; i < data.length; i += 4) {
      const r = buf[i]!;
      const g = buf[i + 1]!;
      const b = buf[i + 2]!;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      const pixelIdx = i >> 2; // same as Math.floor(i / 4)
      const x = pixelIdx % width;
      const y = (pixelIdx - x) / width; // avoids Math.floor

      let t: number;
      if (this.ditheringMode !== 0) {
        const { matrix, size } = this.getBayerMatrix(this.ditheringMode);
        t = matrix[(y % size) * size + (x % size)]! * 255;
      } else if (this.thresholdMode === 0) {
        t = this.threshold;
      } else if (this.thresholdMode === 1) {
        t = Math.random() * 255;
      } else {
        t = this.blueNoiseMatrix[y % 64]![x % 64]! * 255;
      }

      const val = lum >= t ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      // data[i + 3] alpha: unchanged
    }

    return imageData;
  }

  /**
   * Set filter parameters
   * @param params - Partial parameters to update
   */
  setParameters(params: Record<string, number>): void {
    if (params["thresholdMode"] !== undefined) {
      this.thresholdMode = Math.max(
        0,
        Math.min(2, Math.floor(params["thresholdMode"]))
      );
    }
    if (params["threshold"] !== undefined) {
      this.threshold = Math.max(
        0,
        Math.min(255, Math.floor(params["threshold"]))
      );
    }
    if (params["ditheringMode"] !== undefined) {
      this.ditheringMode = Math.max(
        0,
        Math.min(4, Math.floor(params["ditheringMode"]))
      );
    }
  }

  /**
   * Get default parameter values
   * @returns Default parameters object
   */
  getDefaultParameters(): Record<string, number> {
    return { thresholdMode: 0, threshold: 128, ditheringMode: 0 };
  }

  /**
   * Release the pixel buffer when filter is replaced
   */
  cleanup(): void {
    this.originalDataBuffer = null;
  }
}
