/**
 * Camera Experiment - Main Entry Point
 * Real-time video filters application
 */

import { VideoSource } from "./video/VideoSource";
import { RenderPipeline } from "./core/RenderPipeline";
import { FPSCounter } from "./core/FPSCounter";
import { SettingsOverlay } from "./ui/SettingsOverlay";
import { I18n, type Language } from "./i18n/translations";

// Import all filters
import { NoneFilter } from "./filters/NoneFilter";
import { InvertFilter } from "./filters/InvertFilter";
import { MotionDetectionFilter } from "./filters/MotionDetectionFilter";
import { PixelateFilter } from "./filters/PixelateFilter";
import { CRTFilter } from "./filters/CRTFilter";
import { RotoscopeFilter } from "./filters/RotoscopeFilter";
import { EdgeDetectionFilter } from "./filters/EdgeDetectionFilter";
import { NightVisionFilter } from "./filters/NightVisionFilter";
import { VHSFilter } from "./filters/VHSFilter";

import type { FilterType } from "./types";
import type { Filter } from "./filters/Filter";

class App {
  private videoSource: VideoSource;
  private renderPipeline: RenderPipeline;
  private fpsCounter: FPSCounter;
  private settingsOverlay: SettingsOverlay;
  private filters: Map<FilterType, Filter>;

  constructor() {
    // Initialize core components
    this.videoSource = new VideoSource();
    this.fpsCounter = new FPSCounter();

    // Initialize all filters
    this.filters = new Map([
      ["none", new NoneFilter()],
      ["invert", new InvertFilter()],
      ["motion", new MotionDetectionFilter()],
      ["pixelate", new PixelateFilter()],
      ["crt", new CRTFilter()],
      ["rotoscope", new RotoscopeFilter()],
      ["edge", new EdgeDetectionFilter()],
      ["nightvision", new NightVisionFilter()],
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
    });

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
      console.error("Failed to start application:", error);

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
    try {
      this.showStatus(t.loading, t.changingWebcam);
      await this.videoSource.startWebcam(deviceId);
      await this.waitForVideoReady();
      this.hideStatus();
    } catch (error) {
      console.error("Failed to switch webcam:", error);
      this.showStatus(t.webcamError, t.errors.generic, true);
    }
  }

  private async handleImageSelected(file: File): Promise<void> {
    const t = I18n.t();
    try {
      this.showStatus(t.loading, t.loadingImage);
      await this.videoSource.loadImage(file);
      this.hideStatus();
    } catch (error) {
      console.error("Failed to load image:", error);
      this.showStatus(t.webcamError, t.errors.generic, true);
    }
  }

  private handleFilterChanged(filterType: FilterType): void {
    const filter = this.filters.get(filterType);
    if (filter === undefined) {
      return;
    }

    this.renderPipeline.setFilter(filter);
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
