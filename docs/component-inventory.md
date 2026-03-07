# Component Inventory — Js-CameraExperiment

## Core Components

| Component | File | Purpose |
|---|---|---|
| `App` | `src/main.ts` | Root controller — wires all modules, handles keyboard shortcuts, manages WebGL toggle, filter parameter state |
| `RenderPipeline` | `src/core/RenderPipeline.ts` | `requestAnimationFrame` loop, filter stack execution, smooth crossfade transitions (300ms), offscreen canvas processing, aspect ratio modes |
| `FPSCounter` | `src/core/FPSCounter.ts` | Sliding window (60 samples) frame-rate calculator |
| `SettingsStorage` | `src/core/SettingsStorage.ts` | LocalStorage persistence with 500ms debounce, `beforeunload` flush, schema version validation (v6) |

## Filter Components (CPU — Canvas 2D)

| Filter | File | Key Algorithm | Parameters |
|---|---|---|---|
| `NoneFilter` | `NoneFilter.ts` | Pass-through | — |
| `AsciiFilter` | `AsciiFilter.ts` | 8×8 cell bitmap font, 9 density levels | `characterSize` |
| `BlackWhiteFilter` | `BlackWhiteFilter.ts` | Luminance binarization + Bayer dithering (2×2–16×16) + blue noise | `thresholdMode`, `threshold`, `ditheringMode` |
| `BlurFilter` | `BlurFilter.ts` | Separable box blur | `kernelSize` |
| `ChromaticAberrationFilter` | `ChromaticAberrationFilter.ts` | RGB channel offset | `offset` |
| `ComicBookFilter` | `ComicBookFilter.ts` | Posterization + thick edge outlines | `edgeSensitivity` |
| `CRTFilter` | `CRTFilter.ts` | Scanline overlay + bloom | `scanlineDarkness`, `scanlineSpacing`, `bloomIntensity` |
| `DepthOfFieldFilter` | `DepthOfFieldFilter.ts` | Radial focus with progressive blur | `focusRadius`, `blurStrength` |
| `EdgeDetectionFilter` | `EdgeDetectionFilter.ts` | Sobel operator (shared utility) | `edgeSensitivity` |
| `GlitchFilter` | `GlitchFilter.ts` | Line shifts, RGB separation, block corruption; FIFO cap 50 | `lineShiftFrequency`, `rgbGlitchFrequency`, `rgbGlitchIntensity`, `blockCorruptionFrequency`, `glitchMinDuration`, `glitchMaxDuration` |
| `InvertFilter` | `InvertFilter.ts` | Color inversion | — |
| `KaleidoscopeFilter` | `KaleidoscopeFilter.ts` | Radial mirror symmetry | `segments`, `autoRotateEnabled`, `rotationSpeed` |
| `MotionDetectionFilter` | `MotionDetectionFilter.ts` | Frame diff heatmap with reference buffer | `sensitivity`, `noiseFilter`, `trailDuration` |
| `NightVisionFilter` | `NightVisionFilter.ts` | Green tint + grain + vignette | `grainIntensity`, `vignetteStrength` |
| `OilPaintingFilter` | `OilPaintingFilter.ts` | 32-level posterization + bilateral blur 3×3 | `colorLevels`, `brushSize`, `edgePreservation` |
| `PixelateFilter` | `PixelateFilter.ts` | Reduced resolution (Game Boy style) | `horizontalResolution`, `verticalResolution` |
| `RotoscopeFilter` | `RotoscopeFilter.ts` | Color quantization + Sobel edge overlay | `colorLevels`, `edgeSensitivity`, `edgeDarkness` |
| `SepiaFilter` | `SepiaFilter.ts` | RGB matrix transformation | — |
| `SobelRainbowFilter` | `SobelRainbowFilter.ts` | HSL hue mapping by edge orientation angle | `edgeSensitivity` |
| `ThermalFilter` | `ThermalFilter.ts` | 256-color infrared LUT | — |
| `VHSFilter` | `VHSFilter.ts` | Tracking lines, color bleed, grain | `glitchFrequency`, `trackingLinesFrequency`, `grainIntensity` |
| `VignetteFilter` | `VignetteFilter.ts` | Radial darkening | `strength` |

## Filter Components (GPU — WebGL)

All 21 GPU filters extend `WebGLFilterBase` and implement the same `Filter` interface. They reside in `src/filters/webgl/`.

| Component | File | Notes |
|---|---|---|
| `WebGLFilterBase` | `WebGLFilterBase.ts` | Shared: shader compilation, texture management, quad buffers, context loss handling, static context-loss callback |
| `AsciiFilterWebGL` | `AsciiFilterWebGL.ts` | GPU ASCII art shader |
| `BlackWhiteFilterWebGL` | `BlackWhiteFilterWebGL.ts` | GPU B&W with dithering |
| `BlurFilterWebGL` | `BlurFilterWebGL.ts` | GPU box blur |
| All others (`*FilterWebGL`) | `*FilterWebGL.ts` | One-to-one GPU counterpart for each CPU filter |

**Lazy instantiation**: WebGL filters are created from factory functions on first use to avoid exceeding the browser's 8–16 concurrent WebGL context limit.

## UI Components

| Component | File | Purpose |
|---|---|---|
| `SettingsOverlay` | `src/ui/SettingsOverlay.ts` | Gear button + sliding panel: video source, filter select, presets, sliders, FPS/WebGL/transition toggles, aspect ratio, language, download |
| `FilterStackUI` | `src/ui/FilterStackUI.ts` | Drag-and-drop chip list for filter stack; max 5 filters, duplicate prevention |
| `AdvancedSettingsModal` | `src/ui/AdvancedSettingsModal.ts` | Full-page accordion modal: all 42 parameters across all filters; expand/collapse all; reset per filter |
| `GitHubCorner` | `src/ui/GitHubCorner.ts` | Animated SVG GitHub link; auto-hide on mouse leave |

## Utility Components

| Component | File | Purpose |
|---|---|---|
| `BrowserCompatibility` | `src/utils/BrowserCompatibility.ts` | Checks: MediaStream, Canvas 2D, Blob, rAF, localStorage; browser detection (Chrome/Firefox/Safari/Edge) |
| `CanvasCapture` | `src/utils/CanvasCapture.ts` | PNG download: `canvas.toBlob()` → Blob → anchor download |
| `Logger` | `src/utils/Logger.ts` | Centralized logging: ring buffer (100 entries), console output in dev only, structured log entries |
| `SobelOperator` | `src/utils/SobelOperator.ts` | Shared 3×3 Sobel gradient computation (Gx, Gy); used by EdgeDetection, Rotoscope, SobelRainbow |
| `Toast` | `src/utils/Toast.ts` | Notification system: FIFO queue (max 3), auto-dismiss, slide-in/out animation, XSS-safe DOM construction |

## Video Components

| Component | File | Purpose |
|---|---|---|
| `VideoSource` | `src/video/VideoSource.ts` | Webcam management (device enumeration, stream lifecycle, 10s init timeout), image file loading (10MB limit, type validation), dimension querying |

## Preset Definitions

| Component | File | Purpose |
|---|---|---|
| `PresetDefinitions` | `src/presets/PresetDefinitions.ts` | 5 preset configs (cinematic, vintageFilm, cyberpunk, surveillance, dreamSequence); validation (no duplicates, max 5 filters) |

## i18n

| Component | File | Purpose |
|---|---|---|
| `I18n` / `translations` | `src/i18n/translations.ts` | French and English translation records; covers all UI labels, filter names, parameter names, error messages, help text |
