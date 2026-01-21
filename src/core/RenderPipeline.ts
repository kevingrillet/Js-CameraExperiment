/**
 * RenderPipeline - Main rendering loop with requestAnimationFrame
 */

import { Filter } from "../filters/Filter";
import { FPSCounter } from "./FPSCounter";
import { VideoSource } from "../video/VideoSource";
import { Logger } from "../utils/Logger";
import { I18n } from "../i18n/translations";
import type { AspectRatioMode, FilterType } from "../types";

export class RenderPipeline {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private videoSource: VideoSource;
  private currentFilter: Filter;
  private fpsCounter: FPSCounter;
  private animationId: number | null = null;
  private aspectRatioMode: AspectRatioMode = "contain";
  private showFPS: boolean = false;
  private isRendering: boolean = false;
  private consecutiveErrors: number = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 10;
  private onErrorCallback?: (error: Error) => void;
  private isPaused: boolean = false;
  private currentFilterType: FilterType = "none";

  constructor(
    canvas: HTMLCanvasElement,
    videoSource: VideoSource,
    initialFilter: Filter,
    fpsCounter: FPSCounter
  ) {
    this.canvas = canvas;
    this.videoSource = videoSource;
    this.currentFilter = initialFilter;
    this.fpsCounter = fpsCounter;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx === null) {
      throw new Error("Unable to get 2D context");
    }
    this.ctx = ctx;

    // Create offscreen canvas for processing
    this.offscreenCanvas = document.createElement("canvas");
    const offscreenCtx = this.offscreenCanvas.getContext("2d", {
      alpha: false,
    });
    if (offscreenCtx === null) {
      throw new Error("Unable to get offscreen 2D context");
    }
    this.offscreenCtx = offscreenCtx;

    // Set canvas to fullscreen
    this.resizeCanvas();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
  }

  /**
   * Set error callback for handling critical render errors
   * @param callback - Function to call when max consecutive errors reached
   */
  setOnError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  private handleResize = (): void => {
    this.resizeCanvas();
  };

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Change the active filter
   * @param filter - The new filter to apply
   * @param filterType - Type of the filter for tracking
   */
  setFilter(filter: Filter, filterType: FilterType): void {
    this.currentFilterType = filterType;

    // Cleanup old filter if it has cleanup method
    if (this.currentFilter.cleanup !== undefined) {
      try {
        this.currentFilter.cleanup();
      } catch (error) {
        Logger.error(
          "Filter cleanup failed",
          error instanceof Error ? error : undefined,
          "RenderPipeline"
        );
      }
    }
    this.currentFilter = filter;
  }

  /**
   * Set aspect ratio mode for video display
   * @param mode - Either "contain" (letterbox) or "cover" (crop)
   */
  setAspectRatioMode(mode: AspectRatioMode): void {
    this.aspectRatioMode = mode;
  }

  /**
   * Toggle FPS counter display
   * @param show - Whether to show FPS counter
   */
  setShowFPS(show: boolean): void {
    this.showFPS = show;
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.animationId !== null) {
      return; // Already running
    }
    this.render();
  }

  /**
   * Pause the render loop
   */
  pause(): void {
    if (this.isPaused) {
      return; // Already paused
    }

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.isPaused = true;
    // Intentionally reset error counter: user-initiated pause is a control action
    // that warrants a fresh start. Previous errors may have been transient issues
    // that the user is attempting to resolve by pausing/resuming.
    this.consecutiveErrors = 0;
    Logger.info("Render pipeline paused", "RenderPipeline");
  }

  /**
   * Resume the render loop
   */
  resume(): void {
    if (!this.isPaused) {
      return; // Not paused
    }

    this.isPaused = false;

    // Note: We do NOT call cleanup() on resume because:
    // - Most filters are stateless (Invert, Pixelate, CRT, etc.) and don't have cleanup()
    // - MotionDetectionFilter needs to keep its reference buffer to avoid false positives
    // - Calling cleanup() would deallocate buffers only to reallocate them immediately
    // The filter will naturally adapt to the resumed frame on next render cycle.

    this.render();
    Logger.info("Render pipeline resumed", "RenderPipeline");
  }

  /**
   * Get pause state
   * @returns True if render pipeline is paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Get canvas element
   * @returns The canvas element being rendered to
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get current filter type
   * @returns The currently active filter type
   */
  getCurrentFilterType(): FilterType {
    return this.currentFilterType;
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main render loop - called via requestAnimationFrame
   * Includes error recovery and graceful degradation
   */
  private render = (): void => {
    this.animationId = requestAnimationFrame(this.render);

    // Update FPS counter
    this.fpsCounter.update();

    // F2: Frame skipping - skip if previous frame still rendering
    if (this.isRendering) {
      return;
    }

    // Check if source is ready
    if (!this.videoSource.isReady()) {
      return;
    }

    const mediaElement = this.videoSource.getMediaElement();
    if (mediaElement === null) {
      return;
    }

    const sourceDimensions = this.videoSource.getDimensions();
    // F7: Validate non-zero dimensions
    if (sourceDimensions.width === 0 || sourceDimensions.height === 0) {
      return;
    }

    this.isRendering = true;

    try {
      // Set offscreen canvas to source dimensions
      this.offscreenCanvas.width = sourceDimensions.width;
      this.offscreenCanvas.height = sourceDimensions.height;

      // Draw source to offscreen canvas
      this.offscreenCtx.drawImage(
        mediaElement,
        0,
        0,
        sourceDimensions.width,
        sourceDimensions.height
      );

      // Get fresh ImageData from canvas (after video draw)
      // Note: We always create new ImageData to avoid buffer pollution between frames
      // Some filters (like MotionDetection) modify the buffer directly
      const imageData = this.offscreenCtx.getImageData(
        0,
        0,
        sourceDimensions.width,
        sourceDimensions.height
      );

      // Apply filter
      const filteredData = this.currentFilter.apply(imageData);

      // Put filtered data back
      this.offscreenCtx.putImageData(filteredData, 0, 0);

      // Clear main canvas
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Calculate aspect ratio scaling
      const { dx, dy, dw, dh } = this.calculateDrawDimensions(
        sourceDimensions.width,
        sourceDimensions.height,
        this.canvas.width,
        this.canvas.height
      );

      // Draw filtered image to visible canvas
      this.ctx.drawImage(this.offscreenCanvas, dx, dy, dw, dh);

      // Draw FPS if enabled
      if (this.showFPS) {
        this.drawFPS();
      }

      // Reset error counter on successful render
      this.consecutiveErrors = 0;
    } catch (error) {
      // F3: Comprehensive error handling with recovery
      this.consecutiveErrors++;

      const errorMessage =
        error instanceof Error ? error.message : "Unknown render error";
      const t = I18n.t();

      Logger.error(
        t.errors.renderError.replace("{message}", errorMessage),
        error instanceof Error ? error : new Error(errorMessage),
        "RenderPipeline"
      );

      // Check if we've exceeded max consecutive errors
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.stop();
        Logger.error(
          `Render loop stopped after ${this.MAX_CONSECUTIVE_ERRORS} consecutive errors`,
          error instanceof Error ? error : new Error(errorMessage),
          "RenderPipeline"
        );

        // Notify callback if set
        if (this.onErrorCallback !== undefined) {
          this.onErrorCallback(
            error instanceof Error ? error : new Error(errorMessage)
          );
        }
      }
      // Continue render loop to attempt recovery
    } finally {
      this.isRendering = false;
    }
  };

  private calculateDrawDimensions(
    sourceWidth: number,
    sourceHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): { dx: number; dy: number; dw: number; dh: number } {
    // F7: Validate non-zero dimensions to prevent NaN
    if (
      sourceWidth === 0 ||
      sourceHeight === 0 ||
      canvasWidth === 0 ||
      canvasHeight === 0
    ) {
      return { dx: 0, dy: 0, dw: canvasWidth, dh: canvasHeight };
    }

    const sourceAspect = sourceWidth / sourceHeight;
    const canvasAspect = canvasWidth / canvasHeight;

    let dw: number;
    let dh: number;
    let dx: number;
    let dy: number;

    if (this.aspectRatioMode === "contain") {
      // Letterbox mode - fit image with black bars
      if (sourceAspect > canvasAspect) {
        // Source is wider - fit to width
        dw = canvasWidth;
        dh = canvasWidth / sourceAspect;
        dx = 0;
        dy = (canvasHeight - dh) / 2;
      } else {
        // Source is taller - fit to height
        dh = canvasHeight;
        dw = canvasHeight * sourceAspect;
        dx = (canvasWidth - dw) / 2;
        dy = 0;
      }
    } else {
      // Cover mode - fill canvas with crop
      if (sourceAspect > canvasAspect) {
        // Source is wider - fit to height and crop width
        dh = canvasHeight;
        dw = canvasHeight * sourceAspect;
        dx = (canvasWidth - dw) / 2;
        dy = 0;
      } else {
        // Source is taller - fit to width and crop height
        dw = canvasWidth;
        dh = canvasWidth / sourceAspect;
        dx = 0;
        dy = (canvasHeight - dh) / 2;
      }
    }

    return { dx, dy, dw, dh };
  }

  private drawFPS(): void {
    this.ctx.save();
    this.ctx.font = "bold 24px monospace";
    this.ctx.fillStyle = "#00ff00";
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 3;

    const text = this.isPaused
      ? I18n.t().paused
      : `${this.fpsCounter.getFPS()} FPS`;
    const x = 20;
    const y = this.canvas.height - 20;

    // Draw text with stroke for visibility
    this.ctx.strokeText(text, x, y);
    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }

  /**
   * Cleanup resources when pipeline is destroyed
   */
  cleanup(): void {
    this.stop();
    window.removeEventListener("resize", this.handleResize);
    if (this.currentFilter.cleanup !== undefined) {
      this.currentFilter.cleanup();
    }
  }
}
