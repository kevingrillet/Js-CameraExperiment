/**
 * MotionDetectionFilter - Detects motion and displays it as a heatmap
 * Blue = low motion, Yellow = medium motion, Red = high motion
 */

import { Filter, validateImageData } from "./Filter";

export class MotionDetectionFilter implements Filter {
  private previousFrame: Uint8ClampedArray | null = null;
  private currentFrameBuffer: Uint8ClampedArray | null = null;
  private motionHeatmap: Uint8ClampedArray | null = null;

  /**
   * Minimum pixel difference (0-255) to consider as motion
   * Lower values = more sensitive to small changes
   * Higher values = only detect significant changes
   */
  private readonly MOTION_THRESHOLD = 25;

  /**
   * Noise reduction threshold to filter out camera sensor noise
   * Small differences below this value are ignored
   */
  private readonly NOISE_REDUCTION = 3;

  /**
   * Decay factor for motion trail (0-1)
   * Higher values = motion fades slower (longer trail)
   * Lower values = motion fades faster (shorter trail)
   */
  private readonly DECAY_FACTOR = 0.9;

  apply(imageData: ImageData): ImageData {
    // Validate input
    validateImageData(imageData);

    const data = imageData.data;

    // Initialize buffers on first call
    if (this.previousFrame === null) {
      this.previousFrame = new Uint8ClampedArray(data.length);
      this.previousFrame.set(data);
      this.motionHeatmap = new Uint8ClampedArray(data.length);
      // Return black frame on first call
      data.fill(0);
      // Set alpha to 255
      for (let i = 3; i < data.length; i += 4) {
        data[i] = 255;
      }
      return imageData;
    }

    // Reuse buffer instead of allocating new one
    if (this.currentFrameBuffer?.length !== data.length) {
      this.currentFrameBuffer = new Uint8ClampedArray(data.length);
    }

    // Copy current frame BEFORE any modification
    this.currentFrameBuffer.set(data);

    // Decay previous heatmap for motion trail effect
    for (let i = 0; i < this.motionHeatmap!.length; i += 4) {
      this.motionHeatmap![i] = Math.floor(
        this.motionHeatmap![i]! * this.DECAY_FACTOR
      );
      this.motionHeatmap![i + 1] = Math.floor(
        this.motionHeatmap![i + 1]! * this.DECAY_FACTOR
      );
      this.motionHeatmap![i + 2] = Math.floor(
        this.motionHeatmap![i + 2]! * this.DECAY_FACTOR
      );
    }

    // Calculate motion and update heatmap
    for (let i = 0; i < data.length; i += 4) {
      const r = this.currentFrameBuffer[i]!;
      const g = this.currentFrameBuffer[i + 1]!;
      const b = this.currentFrameBuffer[i + 2]!;

      const prevR = this.previousFrame[i]!;
      const prevG = this.previousFrame[i + 1]!;
      const prevB = this.previousFrame[i + 2]!;

      // Calculate absolute difference for each channel
      const diffR = Math.abs(r - prevR);
      const diffG = Math.abs(g - prevG);
      const diffB = Math.abs(b - prevB);

      // Average difference across channels
      let motion = (diffR + diffG + diffB) / 3;

      // Apply noise reduction
      if (motion < this.NOISE_REDUCTION) {
        motion = 0;
      }

      // Apply threshold
      if (motion < this.MOTION_THRESHOLD) {
        motion = 0;
      }

      // Map motion intensity to color gradient
      let red = 0;
      let green = 0;
      let blue = 0;

      if (motion > 0) {
        if (motion < 85) {
          // Low motion: Blue to Cyan
          blue = 255;
          green = Math.floor((motion / 85) * 255);
        } else if (motion < 170) {
          // Medium motion: Cyan to Yellow
          const t = (motion - 85) / 85;
          red = Math.floor(t * 255);
          green = 255;
          blue = Math.floor((1 - t) * 255);
        } else {
          // High motion: Yellow to Red
          const t = (motion - 170) / 85;
          red = 255;
          green = Math.floor((1 - t) * 255);
          blue = 0;
        }

        // Update heatmap with new motion (take max of current and decayed)
        this.motionHeatmap![i] = Math.max(red, this.motionHeatmap![i]!);
        this.motionHeatmap![i + 1] = Math.max(
          green,
          this.motionHeatmap![i + 1]!
        );
        this.motionHeatmap![i + 2] = Math.max(
          blue,
          this.motionHeatmap![i + 2]!
        );
      }

      // Display the heatmap (with decay from previous frames)
      data[i] = this.motionHeatmap![i]!;
      data[i + 1] = this.motionHeatmap![i + 1]!;
      data[i + 2] = this.motionHeatmap![i + 2]!;
      data[i + 3] = 255; // Alpha
    }

    // Save current frame for next comparison
    this.previousFrame.set(this.currentFrameBuffer);

    return imageData;
  }

  /**
   * Reset motion detection state when filter is changed
   */
  cleanup(): void {
    this.previousFrame = null;
    this.motionHeatmap = null;
  }
}
