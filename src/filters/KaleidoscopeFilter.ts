/**
 * KaleidoscopeFilter - Creates radial symmetry effect with mirrored segments
 * Transforms image into kaleidoscope pattern with 6 mirrored sections
 */

import { Filter, validateImageData } from "./Filter";
import { Logger } from "../utils/Logger";

export class KaleidoscopeFilter implements Filter {
  /**
   * Number of symmetrical segments (3-12)
   * Default: 6 = hexagonal pattern, each segment = 60° (2π/6 radians)
   * Hexagonal symmetry is natural and computationally efficient (360° divisor)
   */
  private segments = 6;

  /**
   * Source image buffer (copy of original before transformation)
   * Reused across frames to avoid allocations in render loop
   */
  private sourceBuffer: Uint8ClampedArray | null = null;

  /**
   * V6 - Auto-rotation state
   * Rotation offset added to theta before segment mapping
   */
  private rotationOffset = 0;
  private autoRotateEnabled = false;
  private rotationSpeed = 0.5; // degrees per frame (default 0.5°)

  /**
   * Apply kaleidoscope effect to image data
   * Creates radial symmetry by mirroring pixels across segments
   *
   * Algorithm:
   * 1. For each destination pixel (x, y)
   * 2. Convert to polar coordinates (θ, r) from center
   * 3. Map angle θ into first segment [0, 60°]
   * 4. Mirror odd segments for symmetric pattern
   * 5. Convert back to cartesian and sample source pixel
   *
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with kaleidoscope effect
   * @throws Error if imageData is invalid
   */
  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Validate dimensions
      if (width <= 0 || height <= 0) {
        throw new Error(`Invalid dimensions: ${width}x${height}`);
      }

      // Allocate or reuse source buffer
      const expectedLength = data.length;
      if (this.sourceBuffer?.length !== expectedLength) {
        this.sourceBuffer = new Uint8ClampedArray(expectedLength);
      }
      // Copy original data before transformation
      this.sourceBuffer.set(data);

      // Geometric center for polar transformation
      const centerX = width / 2;
      const centerY = height / 2;

      // Segment angle in radians (60° = π/3)
      const segmentAngle = (2 * Math.PI) / this.segments;

      // V6 - Auto-rotation: increment rotation offset if enabled
      if (this.autoRotateEnabled) {
        const radiansPerFrame = (this.rotationSpeed * Math.PI) / 180;
        this.rotationOffset += radiansPerFrame;
        // Keep rotation in [0, 2π] range to avoid overflow
        if (this.rotationOffset >= 2 * Math.PI) {
          this.rotationOffset -= 2 * Math.PI;
        }
      }

      // Transform each destination pixel
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dstIdx = (y * width + x) * 4;

          // Convert to polar coordinates (relative to center)
          const dx = x - centerX;
          const dy = y - centerY;

          // atan2 returns angle in range [-π, π]
          let theta = Math.atan2(dy, dx);
          const radius = Math.sqrt(dx * dx + dy * dy);

          // Normalize angle to [0, 2π] range
          if (theta < 0) {
            theta += 2 * Math.PI;
          }

          // V6 - Apply rotation offset
          theta += this.rotationOffset;
          // Keep in [0, 2π] range
          if (theta >= 2 * Math.PI) {
            theta -= 2 * Math.PI;
          }

          // Map angle to first segment [0, segmentAngle]
          // Determine which segment we're in
          const segmentIndex = Math.floor(theta / segmentAngle);

          // Angle within current segment
          let segmentTheta = theta % segmentAngle;

          // Mirror odd segments for symmetric pattern
          // This creates the characteristic kaleidoscope mirroring
          if (segmentIndex % 2 === 1) {
            segmentTheta = segmentAngle - segmentTheta;
          }

          // Convert back to cartesian coordinates
          const sourceX = centerX + radius * Math.cos(segmentTheta);
          const sourceY = centerY + radius * Math.sin(segmentTheta);

          // Bilinear interpolation for smoother result (anti-aliasing)
          const x0 = Math.floor(sourceX);
          const y0 = Math.floor(sourceY);
          const x1 = Math.min(width - 1, x0 + 1);
          const y1 = Math.min(height - 1, y0 + 1);

          // Clamp coordinates to image bounds
          const cx0 = Math.max(0, Math.min(width - 1, x0));
          const cy0 = Math.max(0, Math.min(height - 1, y0));
          const cx1 = Math.max(0, Math.min(width - 1, x1));
          const cy1 = Math.max(0, Math.min(height - 1, y1));

          // Interpolation weights
          const fx = sourceX - x0;
          const fy = sourceY - y0;

          // Sample 4 neighboring pixels
          const idx00 = (cy0 * width + cx0) * 4;
          const idx10 = (cy0 * width + cx1) * 4;
          const idx01 = (cy1 * width + cx0) * 4;
          const idx11 = (cy1 * width + cx1) * 4;

          // Bilinear interpolation for each channel
          for (let c = 0; c < 3; c++) {
            const v00 = this.sourceBuffer[idx00 + c] ?? 0;
            const v10 = this.sourceBuffer[idx10 + c] ?? 0;
            const v01 = this.sourceBuffer[idx01 + c] ?? 0;
            const v11 = this.sourceBuffer[idx11 + c] ?? 0;

            const v0 = v00 + (v10 - v00) * fx;
            const v1 = v01 + (v11 - v01) * fx;
            data[dstIdx + c] = v0 + (v1 - v0) * fy;
          }
          data[dstIdx + 3] = 255; // Alpha
        }
      }

      return imageData;
    } catch (error) {
      Logger.error(
        "KaleidoscopeFilter error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Set filter parameters
   * @param params - Partial parameters to update
   */
  setParameters(params: Record<string, number>): void {
    if (params["segments"] !== undefined) {
      this.segments = Math.max(3, Math.min(12, Math.floor(params["segments"])));
    }
    // V6 - Auto-rotation controls
    // Support both individual parameters and unified autoRotate parameter
    if (params["autoRotate"] !== undefined) {
      // Unified parameter: 0 = disabled, >0 = enabled with that speed
      if (params["autoRotate"] === 0) {
        this.autoRotateEnabled = false;
      } else {
        this.autoRotateEnabled = true;
        this.rotationSpeed = Math.max(0.1, Math.min(5.0, params["autoRotate"]));
      }
    }
    if (params["autoRotateEnabled"] !== undefined) {
      this.autoRotateEnabled = params["autoRotateEnabled"] === 1;
    }
    if (params["rotationSpeed"] !== undefined) {
      this.rotationSpeed = Math.max(
        0.1,
        Math.min(5.0, params["rotationSpeed"])
      );
    }
    if (params["rotation"] !== undefined) {
      // Manual rotation angle override (when auto-rotate is disabled)
      this.rotationOffset = (params["rotation"] * Math.PI) / 180; // degrees to radians
    }
  }

  /**
   * Get default parameter values
   * @returns Default parameters object
   */
  getDefaultParameters(): Record<string, number> {
    return {
      segments: 6,
      autoRotateEnabled: 0, // 0 = false, 1 = true (slider representation)
      rotationSpeed: 0.5,
    };
  }

  /**
   * Cleanup allocated buffers when filter is replaced
   */
  cleanup(): void {
    try {
      this.sourceBuffer = null;
    } catch (error) {
      Logger.error(
        "KaleidoscopeFilter cleanup error:",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get current auto-rotate state (for localStorage persistence)
   * @returns Auto-rotate state object
   */
  getAutoRotateState(): { enabled: boolean; speed: number } {
    return {
      enabled: this.autoRotateEnabled,
      speed: this.rotationSpeed,
    };
  }
}
