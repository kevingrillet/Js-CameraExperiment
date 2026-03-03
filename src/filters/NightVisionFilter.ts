/**
 * NightVisionFilter - Creates a night vision effect
 * Green tint, grain, and vignetting for light amplification look
 */

import { Filter, validateImageData } from "./Filter";

export class NightVisionFilter implements Filter {
  /**
   * Intensity of film grain noise (0.0-0.5)
   * Default: 0.12 provides visible grain for authentic night vision look
   * Simulates sensor noise from image intensifier tubes
   */
  private grainIntensity = 0.12;

  /**
   * Strength of vignette darkening at edges (0.0-1.0)
   * Default: 0.4 creates noticeable circular darkening around edges
   * Mimics the limited field of view of night vision devices
   */
  private vignetteStrength = 0.4;

  /**
   * M5 FIX - Pre-computed distance ratio map (avoids sqrt per pixel per frame)
   * Cached and reused when dimensions unchanged
   */
  private distanceRatioMap: Float32Array | null = null;
  private lastWidth = 0;
  private lastHeight = 0;

  /**
   * Apply night vision effect to image data
   * Creates green-tinted image with grain and vignetting
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with night vision effect
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // M5 FIX - Compute or reuse distance ratio map (avoids 2M sqrt calls per frame at 1080p)
    if (
      this.distanceRatioMap === null ||
      width !== this.lastWidth ||
      height !== this.lastHeight
    ) {
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      this.distanceRatioMap = new Float32Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          this.distanceRatioMap[y * width + x] =
            Math.sqrt(dx * dx + dy * dy) / maxDistance;
        }
      }
      this.lastWidth = width;
      this.lastHeight = height;
    }

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;

      // Convert to grayscale (perceived luminance)
      const luminance =
        0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;

      // Apply green tint and boost brightness
      const boosted = Math.min(255, luminance * 1.5);

      // Add grain/noise
      const grain = (Math.random() - 0.5) * this.grainIntensity * 255;

      // Use cached distance ratio for vignette
      const vignette =
        1 - this.distanceRatioMap[pixelIndex]! * this.vignetteStrength;

      // Apply night vision effect: mostly green channel
      const value = Math.max(0, Math.min(255, boosted + grain)) * vignette;

      data[i] = value * 0.1; // R - minimal red
      data[i + 1] = value; // G - primary green channel
      data[i + 2] = value * 0.1; // B - minimal blue
      // Alpha unchanged
    }

    return imageData;
  }

  /**
   * Set filter parameters
   * @param params - Partial parameters to update
   */
  setParameters(params: Record<string, number>): void {
    if (params["grainIntensity"] !== undefined) {
      this.grainIntensity = Math.max(
        0,
        Math.min(0.5, params["grainIntensity"])
      );
    }
    if (params["vignetteStrength"] !== undefined) {
      this.vignetteStrength = Math.max(
        0,
        Math.min(1, params["vignetteStrength"])
      );
    }
  }

  /**
   * Get default parameter values
   * @returns Default parameters object
   */
  getDefaultParameters(): Record<string, number> {
    return { grainIntensity: 0.12, vignetteStrength: 0.4 };
  }

  /**
   * M5 FIX - Cleanup cached distance ratio map
   */
  cleanup(): void {
    this.distanceRatioMap = null;
    this.lastWidth = 0;
    this.lastHeight = 0;
  }
}
