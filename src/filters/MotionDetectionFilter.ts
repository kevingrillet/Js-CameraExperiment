/**
 * MotionDetectionFilter - Detects motion and displays it as a heatmap
 * Blue = low motion, Yellow = medium motion, Red = high motion
 */

import { Filter } from "./Filter";

export class MotionDetectionFilter implements Filter {
  private previousFrame: Uint8ClampedArray | null = null;
  private currentFrameBuffer: Uint8ClampedArray | null = null;
  private readonly MOTION_THRESHOLD = 25; // Minimum difference to consider as motion
  private readonly NOISE_REDUCTION = 3; // Reduces noise from camera sensor

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;

    // Initialize previous frame on first call
    if (this.previousFrame === null) {
      this.previousFrame = new Uint8ClampedArray(data.length);
      this.previousFrame.set(data);
      // Return black frame on first call
      data.fill(0);
      // Set alpha to 255
      for (let i = 3; i < data.length; i += 4) {
        data[i] = 255;
      }
      return imageData;
    }

    // F5: Reuse buffer instead of allocating new one
    if (this.currentFrameBuffer?.length !== data.length) {
      this.currentFrameBuffer = new Uint8ClampedArray(data.length);
    }
    this.currentFrameBuffer.set(data);

    // Calculate motion and create heatmap
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
      // 0-85: Blue (low motion)
      // 85-170: Yellow (medium motion)
      // 170-255: Red (high motion)

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
      }

      data[i] = red;
      data[i + 1] = green;
      data[i + 2] = blue;
      data[i + 3] = 255; // Alpha
    }

    // F5: Swap buffers - reuse memory instead of allocating
    const temp = this.previousFrame;
    this.previousFrame = this.currentFrameBuffer;
    this.currentFrameBuffer = temp;

    return imageData;
  }

  cleanup(): void {
    // Reset previous frame when filter is changed
    this.previousFrame = null;
  }
}
