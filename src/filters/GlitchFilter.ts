/**
 * GlitchFilter - Digital corruption / datamosh effect
 * Temporal artifacts with memory leak protection (FIFO cap)
 */

import { Filter, validateImageData } from "./Filter";
import { Logger } from "../utils/Logger";

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
   * Probability of horizontal line shift per scanline (0.0-0.3)
   * Default: 0.05 - Creates scanline displacement artifacts
   */
  private lineShiftFrequency = 0.05;

  /**
   * Probability of RGB channel separation per frame (0.0-0.5)
   * Default: 0.15 - Creates chromatic aberration-like color splitting
   */
  private rgbGlitchFrequency = 0.15;

  /**
   * Maximum RGB channel offset in pixels (3-20)
   * Default: 8 - Bounded to prevent excessive memory usage
   */
  private rgbGlitchIntensity = 8;

  /**
   * Probability of block corruption per 8x8 block (0.0-0.2)
   * Default: 0.05 - Creates digital noise artifacts
   */
  private blockCorruptionFrequency = 0.05;

  /**
   * Minimum glitch persistence in frames (1-5)
   * Default: 2
   */
  private glitchMinDuration = 2;

  /**
   * Maximum glitch persistence in frames (2-10)
   * Default: 5
   */
  private glitchMaxDuration = 5;

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
   * H3 FIX - Reusable buffer for RGB separation (avoids per-call allocation)
   */
  private rgbSeparationBuffer: Uint8ClampedArray | null = null;

  /**
   * V6 - Temporal variation state
   * Randomizes frequency parameters every 60-120 frames
   */
  private baseLineShiftFrequency = 0.05;
  private baseRgbGlitchFrequency = 0.15;
  private baseBlockCorruptionFrequency = 0.05;
  private variationFrameCounter = 0;
  private variationInterval = 90; // frames (60-120)
  private currentVariationMultiplier = 1.0;

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

    // V6 - Temporal variation: update frequencies periodically
    this.variationFrameCounter++;
    if (this.variationFrameCounter >= this.variationInterval) {
      // Randomize new interval (60-120 frames = 1-2 seconds @ 60 FPS)
      this.variationInterval = 60 + Math.floor(Math.random() * 61);

      // Randomize variation multiplier (±30% of base values)
      // Range: [0.7, 1.3]
      this.currentVariationMultiplier = 0.7 + Math.random() * 0.6;

      // Reset counter
      this.variationFrameCounter = 0;
    }

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
    // V6 - Apply temporal variation to frequencies (use base values × variation multiplier)
    const variedLineShift =
      this.baseLineShiftFrequency * this.currentVariationMultiplier;
    const variedRgbGlitch =
      this.baseRgbGlitchFrequency * this.currentVariationMultiplier;
    const variedBlockCorruption =
      this.baseBlockCorruptionFrequency * this.currentVariationMultiplier;

    // Line shift glitch
    if (Math.random() < variedLineShift) {
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
    if (Math.random() < variedRgbGlitch) {
      const offset = Math.floor(
        (Math.random() - 0.5) * 2 * this.rgbGlitchIntensity
      );
      this.addGlitch({
        type: "rgb",
        data: { offset },
        ttl: this.randomTTL(),
      });
    }

    // Block corruption glitch
    if (Math.random() < variedBlockCorruption) {
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
    // H3 FIX - Reuse buffer instead of allocating per call
    if (this.rgbSeparationBuffer?.length !== data.length) {
      this.rgbSeparationBuffer = new Uint8ClampedArray(data.length);
    }
    this.rgbSeparationBuffer.set(data);
    const tempData = this.rgbSeparationBuffer;

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
      this.glitchMinDuration +
      Math.floor(
        Math.random() * (this.glitchMaxDuration - this.glitchMinDuration + 1)
      )
    );
  }

  /**
   * Set filter parameters
   * @param params - Partial parameters to update
   */
  setParameters(params: Record<string, number>): void {
    if (params["lineShiftFrequency"] !== undefined) {
      this.lineShiftFrequency = Math.max(
        0,
        Math.min(0.3, params["lineShiftFrequency"])
      );
      this.baseLineShiftFrequency = this.lineShiftFrequency; // Update base for variation
    }
    if (params["rgbGlitchFrequency"] !== undefined) {
      this.rgbGlitchFrequency = Math.max(
        0,
        Math.min(0.5, params["rgbGlitchFrequency"])
      );
      this.baseRgbGlitchFrequency = this.rgbGlitchFrequency; // Update base for variation
    }
    if (params["rgbGlitchIntensity"] !== undefined) {
      this.rgbGlitchIntensity = Math.max(
        3,
        Math.min(20, Math.floor(params["rgbGlitchIntensity"]))
      );
    }
    if (params["blockCorruptionFrequency"] !== undefined) {
      this.blockCorruptionFrequency = Math.max(
        0,
        Math.min(0.2, params["blockCorruptionFrequency"])
      );
      this.baseBlockCorruptionFrequency = this.blockCorruptionFrequency; // Update base for variation
    }
    if (params["glitchMinDuration"] !== undefined) {
      this.glitchMinDuration = Math.max(
        1,
        Math.min(5, Math.floor(params["glitchMinDuration"]))
      );
    }
    if (params["glitchMaxDuration"] !== undefined) {
      this.glitchMaxDuration = Math.max(
        2,
        Math.min(10, Math.floor(params["glitchMaxDuration"]))
      );
    }

    // F14 FIX - Validate min/max relationship
    if (this.glitchMinDuration > this.glitchMaxDuration) {
      const temp = this.glitchMinDuration;
      this.glitchMinDuration = this.glitchMaxDuration;
      this.glitchMaxDuration = temp;
      Logger.warn(
        "Auto-corrected glitchMinDuration > glitchMaxDuration",
        "GlitchFilter"
      );
    }

    // Ensure minimum variation range (per spec F14)
    const MIN_VARIATION_RANGE = 1;
    if (this.glitchMaxDuration - this.glitchMinDuration < MIN_VARIATION_RANGE) {
      this.glitchMaxDuration = Math.min(
        10,
        this.glitchMinDuration + MIN_VARIATION_RANGE
      );
      Logger.warn("Enforcing minimum variation range", "GlitchFilter");
    }
  }

  /**
   * Get default parameter values
   * @returns Default parameters object
   */
  getDefaultParameters(): Record<string, number> {
    return {
      lineShiftFrequency: 0.05,
      rgbGlitchFrequency: 0.15,
      rgbGlitchIntensity: 8,
      blockCorruptionFrequency: 0.05,
      glitchMinDuration: 2,
      glitchMaxDuration: 5,
    };
  }

  /**
   * Clean up active glitches
   * Idempotent: safe to call multiple times
   */
  cleanup(): void {
    this.activeGlitches = [];
    this.rgbSeparationBuffer = null;
  }
}
