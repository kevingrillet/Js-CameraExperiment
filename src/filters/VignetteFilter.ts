/**
 * VignetteFilter - Creates artistic vignette effect
 * Radial darkening from edges toward center for spotlight/dramatic effect
 */

import { Filter, validateImageData } from "./Filter";
import { Logger } from "../utils/Logger";

export class VignetteFilter implements Filter {
  /**
   * Strength of vignette darkening at edges (0-1)
   * 0.6 creates strong artistic vignette effect (60% darkening at corners)
   * Balance between visible effect (>0.5) and natural look (<0.8)
   * Higher than NightVision (0.4) for more dramatic artistic effect
   */
  private readonly VIGNETTE_STRENGTH = 0.6;

  /**
   * Apply vignette effect to image data
   * Creates radial darkening from edges toward center (spotlight effect)
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with vignette effect
   * @throws Error if imageData is invalid
   */
  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Center coordinates for radial distance calculation
      const centerX = width / 2;
      const centerY = height / 2;
      // Maximum distance (from center to corner)
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      // NaN safety: if image is 1x1 or invalid, maxDistance could be 0
      if (!isFinite(maxDistance) || maxDistance === 0) {
        return imageData; // No vignette possible on single pixel
      }

      for (let i = 0; i < data.length; i += 4) {
        // Get pixel coordinates
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        // Calculate radial distance from center
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // NaN safety check for distance calculation
        if (!isFinite(distance)) {
          continue; // Skip pixel if NaN/Infinity
        }

        // Normalize distance (0 at center, 1 at corner)
        const normalizedDistance = distance / maxDistance;

        // Apply quadratic falloff for smooth transition
        // darkness = 0 at center, VIGNETTE_STRENGTH at corners
        // Clamp to [0, VIGNETTE_STRENGTH] for safety
        const darkness = Math.min(
          this.VIGNETTE_STRENGTH,
          normalizedDistance * normalizedDistance * this.VIGNETTE_STRENGTH
        );

        // Apply darkening to all RGB channels
        // pixelValue = originalValue * (1 - darkness)
        const multiplier = 1 - darkness;

        data[i] = data[i]! * multiplier; // R
        data[i + 1] = data[i + 1]! * multiplier; // G
        data[i + 2] = data[i + 2]! * multiplier; // B
        // Alpha unchanged
      }

      return imageData;
    } catch (error) {
      Logger.error(
        "VignetteFilter error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }
}
