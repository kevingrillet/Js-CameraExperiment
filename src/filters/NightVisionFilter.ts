/**
 * NightVisionFilter - Creates a night vision effect
 * Green tint, grain, and vignetting for light amplification look
 */

import { Filter, validateImageData } from "./Filter";

export class NightVisionFilter implements Filter {
  /**
   * Intensity of film grain noise (0-1)
   * 0.15 provides visible grain for authentic night vision look
   * Simulates sensor noise from image intensifier tubes
   */
  private readonly GRAIN_INTENSITY = 0.15;

  /**
   * Strength of vignette darkening at edges (0-1)
   * 0.4 creates noticeable circular darkening around edges
   * Mimics the limited field of view of night vision devices
   */
  private readonly VIGNETTE_STRENGTH = 0.4;

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

    // Center coordinates for vignette
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let i = 0; i < data.length; i += 4) {
      // Get pixel coordinates
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      // Convert to grayscale (perceived luminance)
      const luminance =
        0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;

      // Apply green tint and boost brightness
      const boosted = Math.min(255, luminance * 1.5);

      // Add grain/noise
      const grain = (Math.random() - 0.5) * this.GRAIN_INTENSITY * 255;

      // Calculate vignette based on distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const vignette = 1 - (distance / maxDistance) * this.VIGNETTE_STRENGTH;

      // Apply night vision effect: mostly green channel
      const value = Math.max(0, Math.min(255, boosted + grain)) * vignette;

      data[i] = value * 0.1; // R - minimal red
      data[i + 1] = value; // G - primary green channel
      data[i + 2] = value * 0.1; // B - minimal blue
      // Alpha unchanged
    }

    return imageData;
  }
}
