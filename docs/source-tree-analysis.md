# Source Tree Analysis — Js-CameraExperiment

```
Js-CameraExperiment/
├── index.html                          # Single-page entry (inline CSS, canvas element)
├── package.json                        # npm manifest, scripts, devDependencies
├── tsconfig.json                       # TypeScript config (strict, ES2022, bundler resolution)
├── vite.config.ts                      # Vite config (base path, dev server port 3000)
├── vitest.config.ts                    # Vitest config (happy-dom, V8 coverage, exclusions)
├── playwright.config.ts                # Playwright config (Chromium, fake camera, SwiftShader)
├── eslint.config.js                    # ESLint flat config (strict TS rules)
├── README.md                           # Project documentation (FR + EN)
│
├── src/                                # ★ Application source code
│   ├── main.ts                         # ★ ENTRY POINT — App class, bootstraps everything
│   │
│   ├── core/                           # Core runtime modules
│   │   ├── RenderPipeline.ts           # rAF render loop, filter stack execution, smooth transitions
│   │   ├── FPSCounter.ts               # Frame rate measurement (60-sample sliding window)
│   │   ├── SettingsStorage.ts          # LocalStorage persistence with debounce (500ms)
│   │   └── __tests__/                  # Unit tests for core modules
│   │
│   ├── filters/                        # ★ All 22 CPU filter implementations
│   │   ├── Filter.ts                   # Filter interface + validateImageData()
│   │   ├── NoneFilter.ts              # Pass-through (no processing)
│   │   ├── AsciiFilter.ts            # ASCII art conversion (8×8 cells, bitmap font)
│   │   ├── BlackWhiteFilter.ts        # Binary B&W with Bayer dithering modes
│   │   ├── BlurFilter.ts             # Box blur (separable 5×5)
│   │   ├── ChromaticAberrationFilter.ts  # RGB channel offset
│   │   ├── ComicBookFilter.ts         # Posterization + thick edge outlines
│   │   ├── CRTFilter.ts              # Scanlines + bloom simulation
│   │   ├── DepthOfFieldFilter.ts      # Radial bokeh blur
│   │   ├── EdgeDetectionFilter.ts     # Sobel edge detection (white on black)
│   │   ├── GlitchFilter.ts           # Line shifts, RGB separation, block corruption (FIFO 50 max)
│   │   ├── InvertFilter.ts           # Color inversion
│   │   ├── KaleidoscopeFilter.ts      # Radial symmetry (configurable segments, auto-rotate)
│   │   ├── MotionDetectionFilter.ts   # Frame diff heatmap with reference buffer
│   │   ├── NightVisionFilter.ts       # Green-tint + grain + vignette
│   │   ├── OilPaintingFilter.ts       # Posterization + bilateral blur
│   │   ├── PixelateFilter.ts          # Retro Game Boy resolution
│   │   ├── RotoscopeFilter.ts         # Color quantization + Sobel edges
│   │   ├── SepiaFilter.ts            # RGB matrix sepia toning
│   │   ├── SobelRainbowFilter.ts      # HSL-mapped edge orientation coloring
│   │   ├── ThermalFilter.ts           # 256-color infrared LUT
│   │   ├── VHSFilter.ts              # Analog VHS artifacts (tracking lines, grain)
│   │   ├── VignetteFilter.ts          # Radial darkening spotlight
│   │   ├── webgl/                      # ★ 21 WebGL GPU-accelerated filter implementations
│   │   │   ├── WebGLFilterBase.ts     # Shared WebGL utilities (shader compile, texture mgmt, context loss)
│   │   │   ├── AsciiFilterWebGL.ts    # GPU ASCII art
│   │   │   ├── BlackWhiteFilterWebGL.ts
│   │   │   ├── BlurFilterWebGL.ts
│   │   │   ├── ChromaticAberrationFilterWebGL.ts
│   │   │   ├── ComicBookFilterWebGL.ts
│   │   │   ├── CRTFilterWebGL.ts
│   │   │   ├── DepthOfFieldFilterWebGL.ts
│   │   │   ├── EdgeDetectionFilterWebGL.ts
│   │   │   ├── GlitchFilterWebGL.ts
│   │   │   ├── InvertFilterWebGL.ts
│   │   │   ├── KaleidoscopeFilterWebGL.ts
│   │   │   ├── MotionDetectionFilterWebGL.ts
│   │   │   ├── NightVisionFilterWebGL.ts
│   │   │   ├── OilPaintingFilterWebGL.ts
│   │   │   ├── PixelateFilterWebGL.ts
│   │   │   ├── RotoscopeFilterWebGL.ts
│   │   │   ├── SepiaFilterWebGL.ts
│   │   │   ├── SobelRainbowFilterWebGL.ts
│   │   │   ├── ThermalFilterWebGL.ts
│   │   │   ├── VHSFilterWebGL.ts
│   │   │   ├── VignetteFilterWebGL.ts
│   │   │   └── __tests__/             # WebGL filter unit tests
│   │   └── __tests__/                 # CPU filter unit tests (one per filter + shared)
│   │
│   ├── i18n/                           # Internationalization
│   │   ├── translations.ts            # FR/EN translation records (Translations type)
│   │   └── __tests__/
│   │
│   ├── presets/                        # Filter stack presets
│   │   ├── PresetDefinitions.ts       # 5 presets (cinematic, vintageFilm, cyberpunk, surveillance, dreamSequence)
│   │   └── __tests__/
│   │
│   ├── types/                          # Shared TypeScript types
│   │   └── index.ts                   # FilterType union, AVAILABLE_FILTERS, all FilterParams interfaces, FILTER_PARAM_DEFS
│   │
│   ├── ui/                             # UI components (vanilla DOM)
│   │   ├── SettingsOverlay.ts         # Gear button + settings panel (filter, source, FPS, WebGL toggles)
│   │   ├── FilterStackUI.ts           # Drag-and-drop filter chip list
│   │   ├── AdvancedSettingsModal.ts   # Accordion modal for all 42 filter params
│   │   ├── GitHubCorner.ts            # Animated GitHub link (auto-hide)
│   │   └── __tests__/
│   │
│   ├── utils/                          # Shared utilities
│   │   ├── BrowserCompatibility.ts    # API support checks, browser detection
│   │   ├── CanvasCapture.ts           # PNG download from canvas (toBlob)
│   │   ├── Logger.ts                  # Centralized logging (dev-only console output, 100-entry ring buffer)
│   │   ├── SobelOperator.ts           # Shared Sobel gradient computation (used by 3 filters)
│   │   ├── Toast.ts                   # Notification system (FIFO queue, max 3, XSS-safe DOM construction)
│   │   └── __tests__/
│   │
│   └── video/                          # Video source management
│       ├── VideoSource.ts             # Webcam (MediaStream) + image file loading, device enumeration
│       └── __tests__/
│
├── e2e/                                # ★ Playwright E2E tests
│   ├── filters-cpu.spec.ts            # CPU filter smoke tests (all 22 filters + presets)
│   ├── filters-gpu.spec.ts            # GPU filter smoke tests (all 21 WebGL filters + presets)
│   ├── fps.spec.ts                    # FPS validation (per-filter minimum threshold)
│   ├── memory.spec.ts                 # Memory leak detection (heap growth across 3 cycles)
│   ├── webgl-errors.spec.ts           # WebGL error handling + fallback tests
│   ├── fixtures/
│   │   └── base-fixture.ts            # Custom Playwright fixture (console interception, app readiness)
│   └── helpers/
│       ├── filter-helpers.ts          # Filter selection, FPS reading, preset loading via test hooks
│       └── memory-helpers.ts          # CDP heap profiling + GC utilities
│
├── .github/
│   ├── workflows/
│   │   ├── validate.yml               # CI: type-check, tests, lint, format, build
│   │   ├── e2e.yml                    # CI: Playwright E2E tests
│   │   ├── deploy.yml                 # CD: Build + deploy to GitHub Pages
│   │   ├── links.yml                  # Scheduled markdown link checker
│   │   └── dependabot-auto-merge.yml  # Auto-merge Dependabot PRs
│   └── copilot-instructions.md        # BMAD project instructions
│
├── coverage/                           # Generated unit test coverage reports
├── playwright-report/                  # Generated Playwright HTML report
└── test-results/                       # Generated Playwright test artifacts
```

## Critical Folders

| Folder | Purpose | Criticality |
|---|---|---|
| `src/` | All application source code | Core — 62 source files |
| `src/core/` | Render pipeline, FPS, storage | Core runtime — app won't work without these |
| `src/filters/` | 22 CPU filter classes | Core feature — the primary value proposition |
| `src/filters/webgl/` | 21 GPU filter classes + base | V7 feature — WebGL acceleration |
| `src/ui/` | Settings overlay, filter stack, modal | User interface — interaction layer |
| `src/types/` | Shared types, filter param definitions | Type system backbone |
| `e2e/` | Playwright E2E tests | Quality assurance — smoke, FPS, memory |

## Entry Points

| Entry Point | Description |
|---|---|
| `index.html` | HTML shell — loads `src/main.ts` via Vite |
| `src/main.ts` | `App` class — instantiates VideoSource, RenderPipeline, all filters, UI, and starts the render loop |
