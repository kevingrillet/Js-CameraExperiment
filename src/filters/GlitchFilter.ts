/**
 * GlitchFilter - Digital corruption / datamosh effect
 * Temporal artifacts with memory leak protection (FIFO cap)
 */

import { Filter, validateImageData } from "./Filter";

/**
 * Glitch artifact types
 */
type GlitchType = "shift" | "rgb" | "block";

/**
 * Active glitch with time-to-live
 */
interface ActiveGlitch {
  type: GlitchType;
  data: Uint8ClampedArray | { offset: number };
  ttl: number;
}

export class GlitchFilter implements Filter {
  /**
   * Probability of horizontal line shift per scanline (10%)
   * Creates scanline displacement artifacts
   */
  private readonly LINE_SHIFT_PROBABILITY = 0.1;

  /**
   * Probability of RGB channel separation per frame (15%)
   * Creates chromatic aberration-like color splitting
   */
  private readonly RGB_SEPARATION_PROBABILITY = 0.15;

  /**
   * Maximum RGB channel offset in pixels (±10px)
   * Bounded to prevent excessive memory usage
   */
  private readonly RGB_OFFSET_MAX = 10;

  /**
   * Probability of block corruption per 8x8 block (5%)
   * Creates digital noise artifacts
   */
  private readonly BLOCK_CORRUPTION_PROBABILITY = 0.05;

  /**
   * Minimum glitch persistence in frames
   */
  private readonly GLITCH_TTL_MIN = 2;

  /**
   * Maximum glitch persistence in frames
   */
  private readonly GLITCH_TTL_MAX = 3;

  /**
   * Maximum active glitches cap (FIFO eviction)
   * CRITICAL: Prevents memory leak from unbounded growth
   * Without cap: 10-15% probability × 30 FPS = 100+ objects in 30s
   */
  private readonly MAX_ACTIVE_GLITCHES = 50;

  /**
   * Active glitches with temporal persistence
   * FIFO eviction when length exceeds MAX_ACTIVE_GLITCHES
   */
  private activeGlitches: ActiveGlitch[] = [];

  /**
   * Apply glitch/datamosh effect to image data
   * Combines random line shifts, RGB separation, block corruption
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with glitch effects
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Apply active glitches first (before TTL decrement)
    for (const glitch of this.activeGlitches) {
      this.applyGlitch(data, width, height, glitch);
    }

    // Decrement TTL and remove expired glitches (reverse iteration for safe removal)
    for (let i = this.activeGlitches.length - 1; i >= 0; i--) {
      const glitch = this.activeGlitches[i]!;
      glitch.ttl -= 1;
      if (glitch.ttl <= 0) {
        this.activeGlitches.splice(i, 1);
      }
    }

    // Generate new glitch effects (random)
    this.generateNewGlitches(data, width, height);

    return imageData;
  }

  private applyGlitch(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    glitch: ActiveGlitch
  ): void {
    if (glitch.type === "shift" && glitch.data instanceof Uint8ClampedArray) {
      // Apply stored scanline shift
      const rowData = glitch.data;
      const randomRow = Math.floor(Math.random() * height);
      const rowStart = randomRow * width * 4;
      for (let i = 0; i < rowData.length && i < width * 4; i++) {
        data[rowStart + i] = rowData[i]!;
      }
    } else if (glitch.type === "rgb" && "offset" in glitch.data) {
      // Apply RGB channel separation (simplified temporal persistence)
      const offset = glitch.data.offset;
      this.applyRgbSeparation(data, width, height, offset);
    } else if (
      glitch.type === "block" &&
      glitch.data instanceof Uint8ClampedArray
    ) {
      // Apply block corruption (simplified - random placement)
      const blockData = glitch.data;
      const blockX = Math.floor(Math.random() * (width / 8));
      const blockY = Math.floor(Math.random() * (height / 8));
      this.applyBlockCorruption(
        data,
        width,
        height,
        blockX * 8,
        blockY * 8,
        blockData
      );
    }
  }

  private generateNewGlitches(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    // Line shift glitch
    if (Math.random() < this.LINE_SHIFT_PROBABILITY) {
      const randomRow = Math.floor(Math.random() * height);
      const rowStart = randomRow * width * 4;
      const rowData = new Uint8ClampedArray(width * 4);
      for (let i = 0; i < width * 4; i++) {
        rowData[i] = data[rowStart + i]!;
      }

      const shift = Math.floor((Math.random() - 0.5) * width * 0.1); // ±10% width
      const shiftedData = new Uint8ClampedArray(width * 4);
      for (let x = 0; x < width; x++) {
        const srcX = (x - shift + width) % width;
        for (let c = 0; c < 4; c++) {
          shiftedData[x * 4 + c] = rowData[srcX * 4 + c]!;
        }
      }

      this.addGlitch({
        type: "shift",
        data: shiftedData,
        ttl: this.randomTTL(),
      });
    }

    // RGB separation glitch
    if (Math.random() < this.RGB_SEPARATION_PROBABILITY) {
      const offset = Math.floor(
        (Math.random() - 0.5) * 2 * this.RGB_OFFSET_MAX
      );
      this.addGlitch({
        type: "rgb",
        data: { offset },
        ttl: this.randomTTL(),
      });
    }

    // Block corruption glitch
    if (Math.random() < this.BLOCK_CORRUPTION_PROBABILITY) {
      const blockData = new Uint8ClampedArray(8 * 8 * 4);
      for (let i = 0; i < blockData.length; i++) {
        blockData[i] = Math.floor(Math.random() * 256);
      }

      this.addGlitch({
        type: "block",
        data: blockData,
        ttl: this.randomTTL(),
      });
    }
  }

  private applyRgbSeparation(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    offset: number
  ): void {
    const tempData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dstIdx = (y * width + x) * 4;

        // Separate RGB channels with different offsets
        const redX = (x + offset + width) % width;
        const blueX = (x - offset + width) % width;

        data[dstIdx] = tempData[(y * width + redX) * 4]!; // Red offset
        // Green stays at original position (tempData[dstIdx + 1])
        data[dstIdx + 2] = tempData[(y * width + blueX) * 4 + 2]!; // Blue -offset
      }
    }
  }

  private applyBlockCorruption(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number,
    blockData: Uint8ClampedArray
  ): void {
    for (let by = 0; by < 8; by++) {
      for (let bx = 0; bx < 8; bx++) {
        const px = x + bx;
        const py = y + by;
        if (px < width && py < height) {
          const idx = (py * width + px) * 4;
          const blockIdx = (by * 8 + bx) * 4;
          data[idx] = blockData[blockIdx]!;
          data[idx + 1] = blockData[blockIdx + 1]!;
          data[idx + 2] = blockData[blockIdx + 2]!;
        }
      }
    }
  }

  private addGlitch(glitch: ActiveGlitch): void {
    // FIFO eviction: Remove oldest glitch if at capacity
    if (this.activeGlitches.length >= this.MAX_ACTIVE_GLITCHES) {
      this.activeGlitches.shift();
    }

    this.activeGlitches.push(glitch);
  }

  private randomTTL(): number {
    return (
      this.GLITCH_TTL_MIN +
      Math.floor(
        Math.random() * (this.GLITCH_TTL_MAX - this.GLITCH_TTL_MIN + 1)
      )
    );
  }

  /**
   * Clean up active glitches
   * Idempotent: safe to call multiple times
   */
  cleanup(): void {
    this.activeGlitches = [];
  }
}
