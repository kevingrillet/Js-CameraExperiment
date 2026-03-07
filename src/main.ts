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
import { SettingsStorage } from "./core/SettingsStorage";
import type { StoredSettings } from "./types";
import { Toast } from "./utils/Toast";
import { WebGLFilterBase } from "./filters/webgl/WebGLFilterBase";
import { BlurFilterWebGL } from "./filters/webgl/BlurFilterWebGL";
import { BlackWhiteFilterWebGL } from "./filters/webgl/BlackWhiteFilterWebGL";
import { SepiaFilterWebGL } from "./filters/webgl/SepiaFilterWebGL";
import { InvertFilterWebGL } from "./filters/webgl/InvertFilterWebGL";
import { VignetteFilterWebGL } from "./filters/webgl/VignetteFilterWebGL";
import { ChromaticAberrationFilterWebGL } from "./filters/webgl/ChromaticAberrationFilterWebGL";
import { CRTFilterWebGL } from "./filters/webgl/CRTFilterWebGL";
import { EdgeDetectionFilterWebGL } from "./filters/webgl/EdgeDetectionFilterWebGL";
import { SobelRainbowFilterWebGL } from "./filters/webgl/SobelRainbowFilterWebGL";
import { ThermalFilterWebGL } from "./filters/webgl/ThermalFilterWebGL";
import { NightVisionFilterWebGL } from "./filters/webgl/NightVisionFilterWebGL";
import { ComicBookFilterWebGL } from "./filters/webgl/ComicBookFilterWebGL";
import { RotoscopeFilterWebGL } from "./filters/webgl/RotoscopeFilterWebGL";
import { KaleidoscopeFilterWebGL } from "./filters/webgl/KaleidoscopeFilterWebGL";
import { PixelateFilterWebGL } from "./filters/webgl/PixelateFilterWebGL";
import { VHSFilterWebGL } from "./filters/webgl/VHSFilterWebGL";
import { GlitchFilterWebGL } from "./filters/webgl/GlitchFilterWebGL";
import { OilPaintingFilterWebGL } from "./filters/webgl/OilPaintingFilterWebGL";
import { DepthOfFieldFilterWebGL } from "./filters/webgl/DepthOfFieldFilterWebGL";
import { AsciiFilterWebGL } from "./filters/webgl/AsciiFilterWebGL";
import { MotionDetectionFilterWebGL } from "./filters/webgl/MotionDetectionFilterWebGL";
import { BrowserCompatibility } from "./utils/BrowserCompatibility";

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
import { BlackWhiteFilter } from "./filters/BlackWhiteFilter";
import { ChromaticAberrationFilter } from "./filters/ChromaticAberrationFilter";
import { ThermalFilter } from "./filters/ThermalFilter";
import { ComicBookFilter } from "./filters/ComicBookFilter";
import { DepthOfFieldFilter } from "./filters/DepthOfFieldFilter";
import { KaleidoscopeFilter } from "./filters/KaleidoscopeFilter";
import { VignetteFilter } from "./filters/VignetteFilter";

import type { FilterType } from "./types";
import type { Filter } from "./filters/Filter";
import { getPreset } from "./presets/PresetDefinitions";

class App {
  private videoSource: VideoSource;
  private renderPipeline: RenderPipeline;
  private fpsCounter: FPSCounter;
  private settingsOverlay: SettingsOverlay;
  private filters: Map<FilterType, Filter>;
  private currentFilterStack: FilterType[] = ["none"];
  private currentWebcamDeviceId: string | undefined;
  private isDownloading: boolean = false;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;
  private canvasClickHandler: ((event: MouseEvent) => void) | null = null;
  private webglEnabled: boolean = false;
  private webglSupported: boolean = false;
  private webglFilters: Map<FilterType, Filter> = new Map();
  /** Factory functions for lazy WebGL filter creation (avoids exceeding context limit) */
  private webglFilterFactories: Map<FilterType, () => Filter> = new Map();
  private smoothTransitionsEnabled: boolean = true;
  /** Guard against recursive context loss callbacks */
  private handlingContextLoss: boolean = false;
  /**
   * Tracked filter parameters - stores actual current values (not defaults)
   * Updated on every parameter change, preset load, and settings restore
   */
  private filterParams: Map<FilterType, Record<string, number>> = new Map();

  constructor() {
    // Initialize core components
    this.videoSource = new VideoSource();
    this.fpsCounter = new FPSCounter();

    // Initialize all filters
    this.filters = new Map([
      ["none", new NoneFilter()],
      ["ascii", new AsciiFilter()],
      ["blur", new BlurFilter()],
      ["bw", new BlackWhiteFilter()],
      ["chromatic", new ChromaticAberrationFilter()],
      ["comicbook", new ComicBookFilter()],
      ["crt", new CRTFilter()],
      ["dof", new DepthOfFieldFilter()],
      ["edge", new EdgeDetectionFilter()],
      ["glitch", new GlitchFilter()],
      ["invert", new InvertFilter()],
      ["kaleidoscope", new KaleidoscopeFilter()],
      ["motion", new MotionDetectionFilter()],
      ["nightvision", new NightVisionFilter()],
      ["oilpainting", new OilPaintingFilter()],
      ["pixelate", new PixelateFilter()],
      ["rotoscope", new RotoscopeFilter()],
      ["sepia", new SepiaFilter()],
      ["sobelrainbow", new SobelRainbowFilter()],
      ["thermal", new ThermalFilter()],
      ["vhs", new VHSFilter()],
      ["vignette", new VignetteFilter()],
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
      onFilterParameterChanged: (
        filterType: FilterType,
        paramName: string,
        value: number
      ): void =>
        this.handleFilterParameterChanged(filterType, paramName, value),
      onFPSToggled: (show: boolean): void =>
        this.renderPipeline.setShowFPS(show),
      onAspectRatioChanged: (mode): void =>
        this.renderPipeline.setAspectRatioMode(mode),
      onLanguageChanged: (lang: Language): void =>
        this.handleLanguageChanged(lang),
      onDownloadClicked: (): void => {
        void this.handleDownloadClick();
      },
      onPresetSelected: (presetName: string): void =>
        this.handlePresetSelected(presetName),
      onFilterStackChanged: (stack: FilterType[]): void =>
        this.handleFilterStackChanged(stack),
      onWebGLToggled: (enabled: boolean): void =>
        this.handleWebGLToggled(enabled),
      onSmoothTransitionsToggled: (enabled: boolean): void =>
        this.handleSmoothTransitionsToggled(enabled),
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

    // F3 FIX - Initialize beforeunload handler for localStorage flush
    SettingsStorage.initializeBeforeUnloadHandler(() =>
      this.getCurrentSettings()
    );

    // F6 FIX - Cleanup filters on page unload to prevent memory leaks
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });

    // Expose dev-only test hook for E2E tests (stripped in production builds)
    const isDev =
      typeof import.meta !== "undefined" &&
      typeof (import.meta as { env?: { DEV?: boolean } }).env?.DEV ===
        "boolean" &&
      (import.meta as unknown as { env: { DEV: boolean } }).env.DEV;
    if (isDev) {
      (window as unknown as Record<string, unknown>)["__TEST_APP__"] = {
        getFPS: (): number => this.fpsCounter.getFPS(),
        getFilterStack: (): string[] => [...this.currentFilterStack],
        isWebGLEnabled: (): boolean => this.webglEnabled,
        triggerWebGLContextLoss: (): void => this.handleWebGLContextLost(),
        setFilterStack: (types: string[]): void =>
          this.handleFilterStackChanged(types as FilterType[]),
      };
    }

    // Start the application
    void this.start();
  }

  private async start(): Promise<void> {
    const t = I18n.t();

    try {
      // Initialize Toast system
      Toast.init();

      // AC 6.1-6.4 - Browser compatibility check at startup
      const compatCheck = BrowserCompatibility.checkCompatibility();
      const browserInfo = BrowserCompatibility.getBrowserInfo();

      Logger.info(`Browser: ${browserInfo.name} ${browserInfo.version}`, "App");

      if (!compatCheck.compatible) {
        // AC 6.3 - Show warning with missing features
        const missingFeatures = compatCheck.missing.join(", ");
        Toast.warning(
          `Your browser may not support all features. Missing: ${missingFeatures}. For best experience, use Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+.`,
          8000 // Longer duration for compatibility warning
        );
        Logger.warn(`Browser compatibility issues: ${missingFeatures}`, "App");
      }

      // AC 6.2 - F9 FIX - Safari-specific warning for performance degradation
      if (browserInfo.isSafari) {
        Toast.warning(
          "Safari users may experience reduced performance with OilPainting and DepthOfField filters.",
          5000
        );
        Logger.info("Safari detected - performance warning shown", "App");
      }

      // Check WebGL support
      const webglSupport = WebGLFilterBase.checkWebGLSupport();
      this.webglSupported = webglSupport.supported;

      if (this.webglSupported) {
        Logger.info(`WebGL ${webglSupport.version ?? "1.0"} supported`, "App");
        this.settingsOverlay.setWebGLAvailable(true);

        // Register WebGL context loss callback before initializing filters
        WebGLFilterBase.setContextLostCallback(() => {
          this.handleWebGLContextLost();
        });

        // Register lazy WebGL filter factories (avoids exceeding browser context limit)
        // Filters are instantiated on-demand only when GPU mode is enabled
        this.webglFilterFactories.set("blur", () => new BlurFilterWebGL());
        this.webglFilterFactories.set("bw", () => new BlackWhiteFilterWebGL());
        this.webglFilterFactories.set("sepia", () => new SepiaFilterWebGL());
        this.webglFilterFactories.set("invert", () => new InvertFilterWebGL());
        this.webglFilterFactories.set(
          "vignette",
          () => new VignetteFilterWebGL()
        );
        this.webglFilterFactories.set(
          "chromatic",
          () => new ChromaticAberrationFilterWebGL()
        );
        this.webglFilterFactories.set("crt", () => new CRTFilterWebGL());
        this.webglFilterFactories.set(
          "edge",
          () => new EdgeDetectionFilterWebGL()
        );
        this.webglFilterFactories.set(
          "sobelrainbow",
          () => new SobelRainbowFilterWebGL()
        );
        this.webglFilterFactories.set(
          "thermal",
          () => new ThermalFilterWebGL()
        );
        this.webglFilterFactories.set(
          "nightvision",
          () => new NightVisionFilterWebGL()
        );
        this.webglFilterFactories.set(
          "comicbook",
          () => new ComicBookFilterWebGL()
        );
        this.webglFilterFactories.set(
          "rotoscope",
          () => new RotoscopeFilterWebGL()
        );
        this.webglFilterFactories.set(
          "kaleidoscope",
          () => new KaleidoscopeFilterWebGL()
        );
        this.webglFilterFactories.set(
          "pixelate",
          () => new PixelateFilterWebGL()
        );
        this.webglFilterFactories.set("vhs", () => new VHSFilterWebGL());
        this.webglFilterFactories.set("glitch", () => new GlitchFilterWebGL());
        this.webglFilterFactories.set(
          "oilpainting",
          () => new OilPaintingFilterWebGL()
        );
        this.webglFilterFactories.set(
          "dof",
          () => new DepthOfFieldFilterWebGL()
        );
        this.webglFilterFactories.set("ascii", () => new AsciiFilterWebGL());
        this.webglFilterFactories.set(
          "motion",
          () => new MotionDetectionFilterWebGL()
        );
        // L1 FIX - WebGL default OFF for compatibility (can be enabled by user or localStorage)
        this.webglEnabled = false;
        Logger.info(
          `WebGL available (${this.webglFilterFactories.size} GPU filters) but disabled by default (compatibility-first)`,
          "App"
        );
      } else {
        Logger.warn("WebGL not supported, using Canvas2D only", "App");
        this.settingsOverlay.setWebGLAvailable(false);
        Toast.warning("WebGL not supported. Using CPU rendering.", 5000);
      }

      // Load saved settings
      this.loadSettings();

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
    const TIMEOUT_MS = 10000; // 10 seconds
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkReady = (): void => {
        if (this.videoSource.isReady()) {
          resolve();
        } else if (Date.now() - startTime > TIMEOUT_MS) {
          reject(new Error("Video source ready timeout"));
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
    // Route through handleFilterStackChanged to respect GPU toggle state
    this.currentFilterStack = [filterType];
    this.settingsOverlay.updateFilterStack(this.currentFilterStack);
    this.handleFilterStackChanged(this.currentFilterStack);
  }

  private handleFilterParameterChanged(
    filterType: FilterType,
    paramName: string,
    value: number
  ): void {
    const filter = this.filters.get(filterType);
    if (filter?.setParameters === undefined) {
      return;
    }

    // Update the filter parameter
    filter.setParameters({ [paramName]: value });

    // Track current parameter value
    if (!this.filterParams.has(filterType)) {
      this.filterParams.set(filterType, {});
    }
    this.filterParams.get(filterType)![paramName] = value;

    // Also update WebGL version if available
    const webglFilter = this.webglFilters.get(filterType);
    if (webglFilter?.setParameters !== undefined) {
      webglFilter.setParameters({ [paramName]: value });
    }

    // Sync UI sliders with current value
    this.settingsOverlay.updateFilterParams(filterType, paramName, value);

    // Save settings with debouncing (500ms)
    this.saveSettings();
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
    // F6 FIX - Stop RenderPipeline to cleanup filters and prevent memory leaks
    this.renderPipeline.stop();

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

  /**
   * Load saved settings from localStorage
   */
  private loadSettings(): void {
    const saved = SettingsStorage.load();
    if (saved === null) {
      Logger.debug("No saved settings, using defaults", "App");
      // Si WebGL activé par défaut, synchroniser avec l'overlay
      if (this.webglEnabled) {
        this.settingsOverlay.setWebGLEnabled(true);
      }
      return;
    }

    // Restore language preference
    if (saved.language !== undefined) {
      I18n.setLanguage(saved.language);
      this.settingsOverlay.updateLabels();
    }

    // Restore WebGL toggle BEFORE filter stack so filters use correct GPU state
    if (saved.webglEnabled !== undefined && this.webglSupported) {
      this.webglEnabled = saved.webglEnabled;
      this.settingsOverlay.setWebGLEnabled(saved.webglEnabled);
    } else if (this.webglEnabled) {
      // Si WebGL activé par défaut, synchroniser avec l'overlay
      this.settingsOverlay.setWebGLEnabled(true);
    }

    // Restore smooth transitions toggle
    if (saved.smoothTransitionsEnabled !== undefined) {
      this.smoothTransitionsEnabled = saved.smoothTransitionsEnabled;
      this.renderPipeline.setSmoothTransitions(saved.smoothTransitionsEnabled);
      this.settingsOverlay.setSmoothTransitions(saved.smoothTransitionsEnabled);
    }

    // Restore filter parameters (before stack rebuild so filters have correct params)
    if (saved.filterParams !== undefined) {
      for (const [filterType, params] of Object.entries(saved.filterParams)) {
        const filter = this.filters.get(filterType as FilterType);
        if (filter?.setParameters !== undefined && params !== undefined) {
          filter.setParameters(params as Record<string, number>);
          // Track restored params
          this.filterParams.set(filterType as FilterType, {
            ...(params as Record<string, number>),
          });

          // Also sync to WebGL filter if already cached
          const webglFilter = this.webglFilters.get(filterType as FilterType);
          if (webglFilter?.setParameters !== undefined) {
            webglFilter.setParameters(params as Record<string, number>);
          }
        }
      }
    }

    // Restore filter stack (now uses correct webglEnabled state)
    if (saved.filterStack !== undefined && saved.filterStack.length > 0) {
      this.handleFilterStackChanged(saved.filterStack);
      this.settingsOverlay.updateFilterStack(saved.filterStack);
    }

    Logger.info("Settings loaded from localStorage", "App");
  }

  /**
   * Get current settings for saving to localStorage
   */
  private getCurrentSettings(): StoredSettings {
    const filterParams: Partial<Record<FilterType, Record<string, number>>> =
      {};

    // Collect actual current filter parameters (not defaults)
    for (const [type, filter] of this.filters.entries()) {
      if (filter.getDefaultParameters !== undefined) {
        // Use tracked params if available, fall back to defaults
        const tracked = this.filterParams.get(type);
        const defaults = filter.getDefaultParameters();
        filterParams[type] =
          tracked !== undefined ? { ...defaults, ...tracked } : defaults;
      }
    }

    return {
      version: 6,
      language: I18n.getCurrentLanguage(),
      filterParams,
      filterStack: this.currentFilterStack,
      webglEnabled: this.webglEnabled,
      smoothTransitionsEnabled: this.smoothTransitionsEnabled,
      kaleidoscopeAutoRotate: (
        this.filters.get("kaleidoscope") as KaleidoscopeFilter | undefined
      )?.getAutoRotateState?.() ?? { enabled: false, speed: 0.5 },
    };
  }

  /**
   * Save current settings to localStorage (debounced)
   */
  private saveSettings(): void {
    const settings = this.getCurrentSettings();
    SettingsStorage.save(settings);
  }

  private handleLanguageChanged(lang: Language): void {
    I18n.setLanguage(lang);
    this.settingsOverlay.updateLabels();
    this.saveSettings();
  }

  /**
   * Handle preset selection - loads preset filters and parameters
   * @param presetName - Name of the preset to load
   */
  private handlePresetSelected(presetName: string): void {
    const preset = getPreset(presetName);
    if (preset === undefined) {
      Logger.error(`Preset not found: ${presetName}`, undefined, "App");
      return;
    }

    // Build filter stack from preset
    const filterStack: FilterType[] = preset.filters.map((f) => f.type);

    // Apply parameters to each filter in the preset
    for (const presetFilter of preset.filters) {
      const filter = this.filters.get(presetFilter.type);
      if (filter?.setParameters !== undefined) {
        filter.setParameters(presetFilter.params);
        // Track preset params
        this.filterParams.set(presetFilter.type, { ...presetFilter.params });

        // Also sync to WebGL filter if available
        const webglFilter = this.webglFilters.get(presetFilter.type);
        if (webglFilter?.setParameters !== undefined) {
          webglFilter.setParameters(presetFilter.params);
        }
      }
    }

    // Update filter stack
    this.currentFilterStack = filterStack;
    this.settingsOverlay.updateFilterStack(filterStack);

    // Rebuild filter instances array and apply to render pipeline
    const filterInstances = filterStack
      .map((type) => {
        if (this.webglEnabled) {
          const webglFilter = this.getOrCreateWebGLFilter(type);
          if (webglFilter !== undefined) {
            return webglFilter;
          }
        }
        return this.filters.get(type);
      })
      .filter((f): f is Filter => f !== undefined);

    this.renderPipeline.setFilterStack(filterInstances, filterStack);

    Logger.info(`Preset loaded: ${preset.name}`, "App");
    const t = I18n.t();
    const displayName =
      (t.presetNames as Record<string, string>)[presetName] ?? preset.name;
    Toast.success(`Preset: ${displayName}`, 2000);

    // Save settings
    this.saveSettings();
  }

  /**
   * Handle filter stack changes from UI
   * @param stack - New filter stack
   */
  private handleFilterStackChanged(stack: FilterType[]): void {
    this.currentFilterStack = stack;

    // Rebuild filter instances array, using WebGL versions if enabled
    const webglUsed: string[] = [];
    const filterInstances = stack
      .map((type) => {
        // Use WebGL version if enabled and available (lazy-init on demand)
        if (this.webglEnabled) {
          const webglFilter = this.getOrCreateWebGLFilter(type);
          if (webglFilter !== undefined) {
            webglUsed.push(type);
            Logger.debug(`Using WebGL ${type} filter`, "App");
            return webglFilter;
          }
        }
        return this.filters.get(type);
      })
      .filter((f): f is Filter => f !== undefined);

    // Apply to render pipeline
    this.renderPipeline.setFilterStack(filterInstances, stack);

    const webglStatus =
      webglUsed.length > 0 ? ` (GPU: ${webglUsed.join(", ")})` : "";
    Logger.info(
      `Filter stack changed: ${stack.join(", ")}${webglStatus}`,
      "App"
    );

    // Save settings
    this.saveSettings();
  }

  /**
   * Handle WebGL toggle
   * @param enabled - Whether WebGL is enabled
   */
  private handleWebGLToggled(enabled: boolean): void {
    if (!this.webglSupported) {
      Toast.warning("WebGL is not supported on this browser", 3000);
      this.settingsOverlay.setWebGLEnabled(false);
      return;
    }

    this.webglEnabled = enabled;
    Logger.info(
      `WebGL ${enabled ? "enabled" : "disabled"}, current stack: [${this.currentFilterStack.join(", ")}]`,
      "App"
    );

    // Cleanup all cached WebGL filters when disabling GPU to free contexts
    if (!enabled) {
      this.cleanupWebGLFilters();
    }

    // Skip smooth transitions when toggling GPU to avoid mixed
    // WebGL/Canvas2D crossfade artifacts (black screen, inverted image, etc.)
    const wasSmooth = this.smoothTransitionsEnabled;
    this.renderPipeline.setSmoothTransitions(false);

    // Rebuild filter stack with new filter versions
    this.handleFilterStackChanged(this.currentFilterStack);

    // Restore smooth transitions to previous state
    this.renderPipeline.setSmoothTransitions(wasSmooth);

    // Save settings
    this.saveSettings();
  }

  /**
   * Handle WebGL context loss — auto-fallback to Canvas2D rendering
   * Disables GPU toggle, shows toast, rebuilds filter stack with CPU filters
   */
  private handleWebGLContextLost(): void {
    // Guard against recursive context loss callbacks (one lost context
    // triggers cleanup which may cause another to fire)
    if (this.handlingContextLoss) {
      return;
    }
    this.handlingContextLoss = true;

    Logger.error(
      "WebGL context lost, falling back to Canvas2D",
      undefined,
      "App"
    );
    Toast.warning(
      "GPU acceleration disabled due to context loss. Switched to CPU rendering.",
      5000
    );

    this.webglEnabled = false;
    this.settingsOverlay.setWebGLEnabled(false);

    // Cleanup all cached WebGL filters to free remaining contexts
    this.cleanupWebGLFilters();

    // Rebuild filter stack with CPU filter versions
    this.handleFilterStackChanged(this.currentFilterStack);
    this.saveSettings();

    this.handlingContextLoss = false;
  }

  /**
   * Handle smooth transitions toggle
   * @param enabled - Whether smooth transitions between filter changes should be enabled
   */
  private handleSmoothTransitionsToggled(enabled: boolean): void {
    this.smoothTransitionsEnabled = enabled;
    this.renderPipeline.setSmoothTransitions(enabled);
    Logger.info(
      `Smooth transitions ${enabled ? "enabled" : "disabled"}`,
      "App"
    );
    this.saveSettings();
  }

  /**
   * Lazily get or create a WebGL filter instance for the given filter type.
   * Only instantiates a new WebGL context when the filter is actually needed,
   * avoiding the browser limit of ~16 simultaneous WebGL contexts.
   * @param type - The filter type to get the WebGL version of
   * @returns The WebGL filter instance, or undefined if no factory exists
   */
  private getOrCreateWebGLFilter(type: FilterType): Filter | undefined {
    // Return cached instance if already created
    const cached = this.webglFilters.get(type);
    if (cached !== undefined) {
      return cached;
    }

    // Try to create a new instance from the factory
    const factory = this.webglFilterFactories.get(type);
    if (factory === undefined) {
      return undefined;
    }

    try {
      const filter = factory();
      this.webglFilters.set(type, filter);

      // Sync any tracked parameters to the new WebGL filter
      const params = this.filterParams.get(type);
      if (params !== undefined && filter.setParameters !== undefined) {
        filter.setParameters(params);
      }

      Logger.debug(`Lazily created WebGL filter: ${type}`, "App");
      return filter;
    } catch (error) {
      Logger.warn(
        `Failed to create WebGL filter for ${type}: ${error instanceof Error ? error.message : String(error)}`,
        "App"
      );
      return undefined;
    }
  }

  /**
   * Cleanup all cached WebGL filter instances, freeing their GPU contexts.
   * Called when GPU mode is disabled or on context loss.
   */
  private cleanupWebGLFilters(): void {
    for (const [type, filter] of this.webglFilters.entries()) {
      try {
        filter.cleanup?.();
        Logger.debug(`Cleaned up WebGL filter: ${type}`, "App");
      } catch {
        // Ignore cleanup errors (context may already be lost)
      }
    }
    this.webglFilters.clear();
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

    if (statusDiv === null || titleEl === null || textEl === null) {
      return;
    }

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

  private hideStatus(): void {
    const statusDiv = document.getElementById("status-message");
    const retryButton = document.getElementById("retry-button");

    if (statusDiv === null || retryButton === null) {
      return;
    }

    statusDiv.classList.remove("show");
    retryButton.style.display = "none";
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
