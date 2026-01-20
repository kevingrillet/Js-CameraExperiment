/**
 * FPS Counter - Calculates and tracks frames per second
 */

export class FPSCounter {
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private readonly MAX_SAMPLES = 60;

  /**
   * Update the FPS counter with a new frame
   * Should be called once per frame in the render loop
   */
  update(): void {
    const now = performance.now();

    if (this.lastFrameTime !== 0) {
      const delta = now - this.lastFrameTime;
      this.frameTimes.push(delta);

      // Keep only the last MAX_SAMPLES frames
      if (this.frameTimes.length > this.MAX_SAMPLES) {
        this.frameTimes.shift();
      }
    }

    this.lastFrameTime = now;
  }

  /**
   * Get the current FPS value
   * @returns The average FPS over recent frames
   */
  getFPS(): number {
    if (this.frameTimes.length === 0) {
      return 0;
    }

    const avgDelta =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    // F6: Prevent division by zero and handle edge cases
    if (avgDelta === 0 || !isFinite(avgDelta)) {
      return 0;
    }

    return Math.round(1000 / avgDelta);
  }

  /**
   * Reset the FPS counter
   */
  reset(): void {
    this.frameTimes = [];
    this.lastFrameTime = 0;
  }
}
