# Architecture — Js-CameraExperiment

## Technology Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Language | TypeScript | 5.9.3 | Strict type safety (`strict: true`, 10+ strict flags), ES2022 target |
| Build | Vite | 7.3.1 | Fast HMR, ESM-native bundling, simple config |
| Runtime | Browser (Canvas 2D + WebGL) | — | Zero-dependency client; leverages native GPU APIs |
| Unit Tests | Vitest + happy-dom | 4.0.18 | Fast, Vite-native, globals mode, V8 coverage |
| E2E Tests | Playwright (Chromium only) | 1.58.2 | Fake camera stream, SwiftShader WebGL, CDP memory profiling |
| Lint | ESLint + typescript-eslint | 10.0.3 / 8.56.1 | `strict-boolean-expressions`, `no-explicit-any`, `explicit-function-return-type` |
| Formatting | Prettier | 3.8.1 | Consistent style, enforced via CI |
| Markdown Lint | markdownlint-cli | 0.48.0 | Enforced in CI |
| Git Hooks | Husky + lint-staged | 9.1.7 / 16.3.2 | Pre-commit: eslint fix, prettier write, markdownlint fix |

## Architecture Pattern

**Render Pipeline + Strategy Pattern**

The application follows a real-time game-loop architecture:

1. **VideoSource** acquires frames (webcam via MediaStream API, or static image)
2. **RenderPipeline** runs a `requestAnimationFrame` loop, pulling frames from the source
3. Each frame is drawn to an offscreen canvas, converted to `ImageData`
4. The active **Filter stack** (1–5 filters) transforms `ImageData` sequentially
5. The final result is composited onto the visible `<canvas>` element
6. **FPSCounter** tracks frame timing over a 60-sample sliding window

```
┌──────────────┐    ┌────────────────┐    ┌────────────────────┐
│  VideoSource │───►│ RenderPipeline │───►│  Filter Stack      │
│  (webcam/img)│    │  (rAF loop)    │    │  [F1] → [F2] → …  │
└──────────────┘    └──────┬─────────┘    └────────┬───────────┘
                           │                       │
                    ┌──────▼─────────┐    ┌────────▼───────────┐
                    │  Offscreen     │    │  Main <canvas>     │
                    │  Canvas (2D)   │    │  (final composite) │
                    └────────────────┘    └────────────────────┘
```

### WebGL Acceleration Path (V7)

When WebGL is enabled, each filter in the stack may have a GPU-accelerated implementation:

- `WebGLFilterBase` provides shared shader compilation, texture management, and context lifecycle
- Each `*FilterWebGL` class extends `WebGLFilterBase` with a custom fragment shader
- CPU ↔ GPU fallback: if WebGL context is lost or shader fails to compile, the app automatically falls back to the Canvas 2D filter implementation
- WebGL filters are lazily instantiated via factory functions to avoid exceeding the browser's WebGL context limit

### Filter Architecture

All filters implement the `Filter` interface:

```typescript
interface Filter {
  apply(imageData: ImageData): ImageData;
  cleanup?(): void;
  setParameters?(params: Record<string, number>): void;
  getDefaultParameters?(): Record<string, number>;
}
```

- **22 CPU filters** in `src/filters/` — each is a standalone class
- **21 WebGL filters** in `src/filters/webgl/` — GPU counterparts (all except `NoneFilter`)
- **Shared utilities**: `SobelOperator` is extracted as a reusable module for edge detection algorithms (used by EdgeDetection, Rotoscope, SobelRainbow)
- **Validation**: `validateImageData()` guards all filter inputs

### State Management

- **No external state library** — state is held in the `App` class instance
- **Filter parameters**: `Map<FilterType, Record<string, number>>` tracks current parameter values
- **Persistence**: `SettingsStorage` serializes to `localStorage` with 500ms debounce and `beforeunload` flush
- **Stored settings**: filter stack, parameters, language, FPS toggle, aspect ratio, WebGL toggle, smooth transitions

### UI Architecture

- **No framework** — all UI is programmatically constructed via DOM APIs
- `SettingsOverlay`: gear button + sliding panel with filter selection, presets, sliders
- `FilterStackUI`: drag-and-drop reorderable chip list for the active filter stack
- `AdvancedSettingsModal`: accordion of all 42 parameter sliders across all filters
- `GitHubCorner`: animated SVG link with auto-hide on mouse leave
- `Toast`: notification system with FIFO queue (max 3), slide-in/out animation
- **XSS prevention**: Toast builds DOM programmatically (no `innerHTML` for user content)

## Data Architecture

No backend, no database. All data is ephemeral (video frames) or persisted to `localStorage`:

```json
{
  "version": 6,
  "filterStack": ["glitch", "chromatic", "crt"],
  "filterParams": { "glitch": { "lineShiftFrequency": 0.15 } },
  "language": "en",
  "showFPS": true,
  "aspectRatioMode": "contain",
  "webglEnabled": false,
  "smoothTransitions": true
}
```

## Browser Compatibility

| Browser | Min Version | Status |
|---|---|---|
| Chrome | 90+ | Recommended |
| Firefox | 88+ | Recommended |
| Safari | 14+ | Supported (reduced perf on heavy filters) |
| Edge | 90+ | Recommended (Chromium-based) |

**Required APIs**: MediaStream (webcam), Canvas 2D, WebGL 1.0/2.0 (optional), Blob, requestAnimationFrame, localStorage

## Testing Strategy

### Unit Tests (Vitest)

- **37 test files** across all modules (`src/**/__tests__/*.test.ts`)
- **Environment**: happy-dom (for DOM APIs)
- **Coverage**: V8 provider, reporters: text, html, json, cobertura
- **Exclusions**: Files requiring real browser APIs (WebGL, Canvas capture, FPSCounter with rAF)

### E2E Tests (Playwright)

- **5 spec files**: `filters-cpu`, `filters-gpu`, `fps`, `memory`, `webgl-errors`
- **Browser**: Chromium only, with fake camera stream (`--use-fake-device-for-media-stream`)
- **WebGL**: SwiftShader software renderer (`--use-gl=swiftshader`)
- **Memory profiling**: CDP `HeapProfiler.collectGarbage` + `Performance.getMetrics`
- **FPS validation**: per-filter minimum FPS threshold (15 FPS local, 10 FPS CI)
- **Custom fixtures**: `base-fixture.ts` provides console interception, app readiness helpers

### CI/CD

| Workflow | Trigger | Purpose |
|---|---|---|
| `validate.yml` | push/PR to main, develop | Type-check, unit tests + coverage, ESLint, markdownlint, prettier, build |
| `e2e.yml` | push/PR to main, develop | Playwright E2E tests with report artifacts |
| `deploy.yml` | push to main | Build + deploy to GitHub Pages |
| `links.yml` | push/PR changing `*.md`, weekly | Markdown link checker (lychee) |
| `dependabot-auto-merge.yml` | Dependabot PRs | Auto-merge dependency updates |

## Deployment Architecture

- **Host**: GitHub Pages (static site)
- **Build**: `tsc && vite build` → `dist/` directory
- **Base path**: `/Js-CameraExperiment/` (configured in `vite.config.ts`)
- **CI/CD**: GitHub Actions deploys on push to `main`
- **No server-side components** — fully client-side application
