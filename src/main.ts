/**
 * Camera Experiment - Main Entry Point
 * Real-time video filters application
 */

import { VideoSource } from "./video/VideoSource";
import { RenderPipeline } from "./core/RenderPipeline";
import { FPSCounter } from "./core/FPSCounter";
import { SettingsOverlay } from "./ui/SettingsOverlay";
import { GitHubCorner } from "./ui/GitHubCorner";
import { I18n, type Language } from "./i18n/translations";
import { Logger } from "./utils/Logger";
import { CanvasCapture } from "./utils/CanvasCapture";

// Import all filters
import { NoneFilter } from "./filters/NoneFilter";
import { AsciiFilter } from "./filters/AsciiFilter";
import { InvertFilter } from "./filters/InvertFilter";
import { MotionDetectionFilter } from "./filters/MotionDetectionFilter";
import { PixelateFilter } from "./filters/PixelateFilter";
import { CRTFilter } from "./filters/CRTFilter";
import { RotoscopeFilter } from "./filters/RotoscopeFilter";
import { EdgeDetectionFilter } from "./filters/EdgeDetectionFilter";
import { GlitchFilter } from "./filters/GlitchFilter";
import { NightVisionFilter } from "./filters/NightVisionFilter";
import { OilPaintingFilter } from "./filters/OilPaintingFilter";
import { VHSFilter } from "./filters/VHSFilter";
import { SepiaFilter } from "./filters/SepiaFilter";
import { SobelRainbowFilter } from "./filters/SobelRainbowFilter";
import { BlurFilter } from "./filters/BlurFilter";
import { ChromaticAberrationFilter } from "./filters/ChromaticAberrationFilter";
import { ThermalFilter } from "./filters/ThermalFilter";

import type { FilterType } from "./types";
import type { Filter } from "./filters/Filter";

class App {
  private videoSource: VideoSource;
  private renderPipeline: RenderPipeline;
  private fpsCounter: FPSCounter;
  private settingsOverlay: SettingsOverlay;
  private filters: Map<FilterType, Filter>;
  private currentWebcamDeviceId: string | undefined;
  private isDownloading: boolean = false;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;
  private canvasClickHandler: ((event: MouseEvent) => void) | null = null;

  constructor() {
    // Initialize core components
    this.videoSource = new VideoSource();
    this.fpsCounter = new FPSCounter();

    // Initialize all filters
    this.filters = new Map([
      ["none", new NoneFilter()],
      ["ascii", new AsciiFilter()],
      ["blur", new BlurFilter()],
      ["chromatic", new ChromaticAberrationFilter()],
      ["crt", new CRTFilter()],
      ["edge", new EdgeDetectionFilter()],
      ["glitch", new GlitchFilter()],
      ["invert", new InvertFilter()],
      ["motion", new MotionDetectionFilter()],
      ["nightvision", new NightVisionFilter()],
      ["oilpainting", new OilPaintingFilter()],
      ["pixelate", new PixelateFilter()],
      ["rotoscope", new RotoscopeFilter()],
      ["sepia", new SepiaFilter()],
      ["sobelrainbow", new SobelRainbowFilter()],
      ["thermal", new ThermalFilter()],
      ["vhs", new VHSFilter()],
    ]);

    // Get canvas element
    const canvas = document.getElementById(
      "canvas"
    ) as HTMLCanvasElement | null;
    if (canvas === null) {
      throw new Error("Canvas element not found");
    }

    // Initialize render pipeline
    this.renderPipeline = new RenderPipeline(
      canvas,
      this.videoSource,
      this.filters.get("none")!,
      this.fpsCounter
    );

    // Set error callback for critical render failures
    this.renderPipeline.setOnError((error) => {
      const t = I18n.t();
      this.showStatus(
        t.webcamError,
        t.errors.renderError.replace("{message}", error.message),
        true
      );
    });

    // Initialize settings overlay
    this.settingsOverlay = new SettingsOverlay({
      onWebcamSelected: (deviceId?: string): void => {
        void this.handleWebcamSelected(deviceId);
      },
      onImageSelected: (file: File): void => {
        void this.handleImageSelected(file);
      },
      onFilterChanged: (filterType: FilterType): void =>
        this.handleFilterChanged(filterType),
      onFPSToggled: (show: boolean): void =>
        this.renderPipeline.setShowFPS(show),
      onAspectRatioChanged: (mode): void =>
        this.renderPipeline.setAspectRatioMode(mode),
      onLanguageChanged: (lang: Language): void =>
        this.handleLanguageChanged(lang),
      onDownloadClicked: (): void => {
        void this.handleDownloadClick();
      },
    });

    // Initialize GitHub Corner
    new GitHubCorner("https://github.com/kevingrillet/Js-CameraExperiment");

    // Setup pause/play event listeners
    // Canvas click handler for pause/play
    this.canvasClickHandler = (event: MouseEvent): void => {
      if (event.target === canvas) {
        this.togglePause();
      }
    };
    canvas.addEventListener("click", this.canvasClickHandler);

    // Keyboard handler for shortcuts
    this.keyboardHandler = (event: KeyboardEvent): void => {
      this.handleKeyDown(event);
    };
    document.addEventListener("keydown", this.keyboardHandler);

    // Start the application
    void this.start();
  }

  private async start(): Promise<void> {
    const t = I18n.t();

    try {
      this.showStatus(t.loading, t.initializingWebcam);

      // Get available webcam devices
      const devices = await this.videoSource.getAvailableDevices();
      this.settingsOverlay.updateWebcamDevices(devices);

      // Start default webcam
      await this.videoSource.startWebcam();

      // Wait a bit for the video to be ready
      await this.waitForVideoReady();

      // Hide status message
      this.hideStatus();

      // Start rendering
      this.renderPipeline.start();
    } catch (error) {
      Logger.error(
        "Failed to start application",
        error instanceof Error ? error : new Error(String(error)),
        "App"
      );

      const errorMessage =
        error instanceof Error ? error.message : t.errors.generic;

      // Determine help text based on error
      let helpText = "";
      if (
        errorMessage.includes("refusé") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("permissions")
      ) {
        helpText = t.help.permissionInstructions;
      } else if (errorMessage.includes("HTTPS")) {
        helpText = t.help.httpsRequired;
      } else if (
        errorMessage.includes("Aucune") ||
        errorMessage.includes("No webcam")
      ) {
        helpText = t.help.useImageInstead;
      }

      this.showStatus(t.webcamError, errorMessage, true, helpText);

      // Show retry button
      this.showRetryButton();
    }
  }

  private async waitForVideoReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = (): void => {
        if (this.videoSource.isReady()) {
          resolve();
        } else {
          requestAnimationFrame(checkReady);
        }
      };
      checkReady();
    });
  }

  private async handleWebcamSelected(deviceId?: string): Promise<void> {
    const t = I18n.t();
    const previousDeviceId = this.currentWebcamDeviceId;

    try {
      this.showStatus(t.loading, t.changingWebcam);
      await this.videoSource.startWebcam(deviceId);
      await this.waitForVideoReady();
      this.hideStatus();

      // Save successful device ID
      this.currentWebcamDeviceId = deviceId;
    } catch (error) {
      Logger.error(
        "Failed to switch webcam",
        error instanceof Error ? error : new Error(String(error)),
        "App"
      );

      // Try to rollback to previous webcam
      if (previousDeviceId !== undefined) {
        try {
          await this.videoSource.startWebcam(previousDeviceId);
          await this.waitForVideoReady();
          // TypeScript narrow: previousDeviceId is string here (checked above)
          this.currentWebcamDeviceId = previousDeviceId;
          this.showStatus(
            t.webcamError,
            t.errors.generic + " " + "Reverted to previous webcam.",
            true
          );
        } catch (rollbackError) {
          Logger.error(
            "Rollback to previous webcam failed",
            rollbackError instanceof Error
              ? rollbackError
              : new Error(String(rollbackError)),
            "App"
          );
          this.showStatus(t.webcamError, t.errors.generic, true);
        }
      } else {
        this.showStatus(t.webcamError, t.errors.generic, true);
      }
    }
  }

  private async handleImageSelected(file: File): Promise<void> {
    const t = I18n.t();
    try {
      this.showStatus(t.loading, t.loadingImage);
      await this.videoSource.loadImage(file);
      this.hideStatus();
    } catch (error) {
      Logger.error(
        "Failed to load image",
        error instanceof Error ? error : new Error(String(error)),
        "App"
      );
      const errorMessage =
        error instanceof Error ? error.message : t.errors.generic;
      this.showStatus(t.webcamError, errorMessage, true);
    }
  }

  private handleFilterChanged(filterType: FilterType): void {
    const filter = this.filters.get(filterType);
    if (filter === undefined) {
      return;
    }

    // Cleanup previous filter if it has a cleanup method
    const currentFilterType = this.renderPipeline.getCurrentFilterType();
    if (currentFilterType !== filterType) {
      const previousFilter = this.filters.get(currentFilterType);
      if (previousFilter?.cleanup !== undefined) {
        previousFilter.cleanup();
      }
    }

    this.renderPipeline.setFilter(filter, filterType);
  }

  private async handleDownloadClick(): Promise<void> {
    if (this.isDownloading) {
      return;
    }

    const t = I18n.t();
    this.isDownloading = true;
    this.settingsOverlay.setDownloadEnabled(false);

    try {
      const canvas = this.renderPipeline.getCanvas();
      const filterType = this.renderPipeline.getCurrentFilterType();
      const filename = CanvasCapture.generateFilename(filterType);

      await CanvasCapture.captureCanvas(canvas, filename);

      Logger.info(`Image downloaded: ${filename}`, "App");
    } catch (error) {
      Logger.error(
        "Download failed",
        error instanceof Error ? error : new Error(String(error)),
        "App"
      );
      const errorMessage =
        error instanceof Error ? error.message : t.errors.generic;
      this.showStatus(
        t.errors.downloadFailed.replace("{message}", ""),
        errorMessage,
        true
      );
    } finally {
      this.isDownloading = false;
      this.settingsOverlay.setDownloadEnabled(true);
    }
  }

  private togglePause(): void {
    const pauseOverlay = document.getElementById("pause-overlay");
    if (pauseOverlay === null) {
      return;
    }

    if (this.renderPipeline.getIsPaused()) {
      this.renderPipeline.resume();
      pauseOverlay.classList.add("hidden");
    } else {
      this.renderPipeline.pause();
      pauseOverlay.classList.remove("hidden");
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore if typing in input field or contenteditable element
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable)
    ) {
      return;
    }

    // Spacebar for pause/play
    if (event.key === " ") {
      event.preventDefault();
      this.togglePause();
    }

    // S key for download (only if not already downloading)
    if ((event.key === "s" || event.key === "S") && !this.isDownloading) {
      void this.handleDownloadClick();
    }
  }

  public cleanup(): void {
    // Remove keyboard listener
    if (this.keyboardHandler !== null) {
      document.removeEventListener("keydown", this.keyboardHandler);
      this.keyboardHandler = null;
    }

    // Remove canvas click listener
    if (this.canvasClickHandler !== null) {
      const canvas = this.renderPipeline.getCanvas();
      canvas.removeEventListener("click", this.canvasClickHandler);
      this.canvasClickHandler = null;
    }
  }

  private handleLanguageChanged(lang: Language): void {
    I18n.setLanguage(lang);
    this.settingsOverlay.updateLabels();
  }

  private showStatus(
    title: string,
    text: string,
    isError: boolean = false,
    helpText: string = ""
  ): void {
    const statusDiv = document.getElementById("status-message");
    const titleEl = document.getElementById("status-title");
    const textEl = document.getElementById("status-text");
    const helpEl = document.getElementById("help-text");

    if (statusDiv !== null && titleEl !== null && textEl !== null) {
      titleEl.textContent = title;
      textEl.textContent = text;
      statusDiv.classList.add("show");

      if (isError) {
        statusDiv.classList.add("error");
      } else {
        statusDiv.classList.remove("error");
      }

      if (helpEl !== null) {
        if (helpText.length > 0) {
          helpEl.innerHTML = helpText;
          helpEl.style.display = "block";
        } else {
          helpEl.style.display = "none";
        }
      }
    }
  }

  private hideStatus(): void {
    const statusDiv = document.getElementById("status-message");
    const retryButton = document.getElementById("retry-button");

    if (statusDiv !== null) {
      statusDiv.classList.remove("show");
    }

    if (retryButton !== null) {
      retryButton.style.display = "none";
    }
  }

  private showRetryButton(): void {
    const retryButton = document.getElementById("retry-button");
    const t = I18n.t();

    if (retryButton !== null) {
      retryButton.textContent = t.retry;
      retryButton.style.display = "inline-block";
      retryButton.onclick = (): void => {
        retryButton.style.display = "none";
        void this.start();
      };
    }
  }
}

// Start the application when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new App();
  });
} else {
  new App();
}

export {};
