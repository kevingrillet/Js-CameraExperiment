---
project_name: "Js-CameraExperiment"
user_name: "Kevin"
date: "2026-02-28"
sections_completed:
  ["technology_stack", "language_rules", "framework_rules", "testing_rules", "quality_rules", "workflow_rules", "anti_patterns"]
status: "complete"
rule_count: 62
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **TypeScript 5.9.3** — target ES2022, module ESNext, bundler resolution
- **Vite 7.3.1** — dev server on port 3000, base path `/Js-CameraExperiment/`
- **Vitest 4.0.18** — happy-dom environment, globals enabled, v8 coverage
- **Playwright 1.58.2** — Chromium-only E2E tests with fake camera feed, SwiftShader WebGL
- **ESLint 10.0.2** — flat config with `typescript-eslint` type-checked rules
- **Prettier 3.8.1** — double quotes, 2-space indent, trailing comma es5, LF endings
- **Husky 9.1.7 + lint-staged 16.3.0** — pre-commit: lint-staged + full test run
- **markdownlint-cli 0.47.0** — MD013/MD024/MD025 disabled
- **Browser APIs only** — Canvas2D, WebGL2, MediaStream, LocalStorage (zero runtime npm deps)

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **tsconfig strict flags are maximal** — beyond `strict: true`, enforces `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, and all `noUnused*`/`noFallthrough`/`noImplicitReturns` flags
- **Non-null assertion required on indexed access** — `data[i]!` is mandatory due to `noUncheckedIndexedAccess`; TypeScript treats `array[index]` as `T | undefined`
- **Named exports only** — no default exports; one class per file, class name matches filename (e.g., `CRTFilter.ts` exports `class CRTFilter`)
- **Relative imports only** — no path aliases; use `./` and `../` (no `@/` or `~/`)
- **Strict boolean expressions** — `if (value)` is forbidden for strings, numbers, nullable objects; use `if (value !== null)`, `if (value.length > 0)`, `if (value !== undefined)`
- **Explicit return types required** — all functions must have explicit return type annotations (ESLint `@typescript-eslint/explicit-function-return-type: error`)
- **No `any` type** — `@typescript-eslint/no-explicit-any: error`; use `unknown` for dynamic types, then narrow
- **Unused variables prefixed `_`** — parameters/variables starting with `_` are exempt from unused checks
- **Error handling** — use bare `catch` or `error instanceof Error` guard; never assume error shape
- **`import type` for type-only imports** — use `import type { X }` when importing only types

### Framework-Specific Rules (Custom Filter Architecture)

- **Filter interface contract** — every filter must `implements Filter` with `apply(imageData: ImageData): ImageData`; optional `cleanup()`, `setParameters()`, `getDefaultParameters()`
- **`validateImageData()` is mandatory** — must be the first line in every filter's `apply()` method; validates dimensions, data array length, and null/undefined
- **Canvas2D vs WebGL naming** — Canvas2D: `{Name}Filter.ts` in `src/filters/`; WebGL: `{Name}FilterWebGL.ts` in `src/filters/webgl/` extending `WebGLFilterBase`
- **Parameter discriminated unions** — filter params use `type` field as discriminant; all param ranges defined in `FILTER_PARAM_DEFS` (as const) in `src/types/index.ts`
- **Filter stack max 5** — `RenderPipeline` enforces max 5 filters; no duplicate `FilterType` in stack
- **Offscreen canvas pattern** — pixel manipulation happens on offscreen canvas, result drawn to visible canvas
- **Error recovery** — `MAX_CONSECUTIVE_ERRORS = 10` in RenderPipeline; after threshold, triggers error callback instead of continuing
- **WebGL context loss** — `WebGLFilterBase.setContextLostCallback()` enables auto-fallback to Canvas2D; all WebGL code must handle null context gracefully
- **Transitions** — 300ms crossfade on filter switch; `completeTransition()` if already transitioning when new stack set
- **Persistence** — `SettingsStorage` uses versioned key `cameraExperimentSettings_v6`; debounced saves (500ms); `flush()` on `beforeunload`

### Testing Rules

- **Co-located `__tests__/` directories** — tests live in `__tests__/` next to their source (e.g., `src/filters/__tests__/CRTFilter.test.ts`)
- **File naming** — `{ClassName}.test.ts` matching the source file exactly
- **Mock ImageData** — use `{ width, height, data: new Uint8ClampedArray(w * h * 4) } as ImageData`; never use `new ImageData()` (unavailable in happy-dom)
- **Mock canvas context** — create stub objects with `vi.fn()` for each used method; spy on `canvas.getContext` to return mock
- **Mock `document.createElement`** — required when testing classes that create offscreen canvases internally
- **happy-dom limitations** — no `ImageData` constructor, no `performance.now()` with fake timers, no WebGL; exclude tests needing these via `vitest.config.ts` `exclude` array
- **Vitest globals** — `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` available globally; explicit imports still acceptable
- **ESLint relaxation in tests** — `unbound-method: off` for `**/__tests__/**/*.ts` and `**/*.test.ts` files
- **Coverage exclusions** — DOM-intensive UI files, WebGL filters, `main.ts`, static data files, and type-only files excluded from coverage in `vitest.config.ts`

### E2E Testing Rules (Playwright)

- **Test location** — E2E tests live in `e2e/` (separate from unit tests in `src/__tests__/`); file naming: `*.spec.ts`
- **Dedicated tsconfig** — `e2e/tsconfig.json` extends root config with `@playwright/test` types; relaxed `noUnusedLocals`/`noUnusedParameters`
- **Custom fixture** — `e2e/fixtures/base-fixture.ts` provides `appPage`, `consoleErrors`, `consoleWarnings` fixtures with automatic console interception
- **Whitelisted errors** — `WebGL context lost`, `WebGL not initialized` patterns are whitelisted in the base fixture (transient during GPU filter switching)
- **`waitForAppReady()`** — navigates to `./`, waits for `#canvas` visible + `#status-message` disappear + 1s stabilization; must be called at start of every test
- **`disableSmoothTransitions()`** — disables 300ms crossfade to avoid timing issues; call before any filter operations
- **Filter stacking** — use `selectPreset()` helper (not `selectFilter()` multiple times); `selectFilter()` replaces the current filter, it does not stack
- **Test hook `__TEST_APP__`** — dev-only global exposing `getFPS()`, `getFilterStack()`, `isWebGLEnabled()`, `triggerWebGLContextLoss()`; only available when `import.meta.env.DEV` is true
- **CDP for memory tests** — `getHeapUsage()` and `forceGC()` use Chrome DevTools Protocol; always use try/finally for CDP session cleanup
- **`test.info().attach()`** — use instead of `console.log()` for diagnostic data; visible in the HTML report
- **Playwright config** — Chromium with `--use-fake-device-for-media-stream`, `--use-gl=swiftshader`, `--js-flags=--expose-gc`; timeout 90s, workers 1, no retries, trace on failure
- **WebGL canvases are internal** — `WebGLFilterBase` creates canvases via `document.createElement("canvas")` without DOM insertion; cannot query them via `querySelectorAll("canvas")`; use `__TEST_APP__` hook instead
- **FPS threshold** — 15 FPS minimum in SwiftShader (software rendering); real browsers with GPU should achieve 30+ FPS
- **E2E not in pre-commit** — `validate` script runs unit tests only; E2E tests are manual (`npm run test:e2e`) due to ~12 min runtime
- **ESLint for E2E** — relaxed config block in `eslint.config.js` for `e2e/**/*.ts`: `explicit-function-return-type: off`, `strict-boolean-expressions: off`, `no-explicit-any: off`, `no-console: off`

### Code Quality & Style Rules

- **No `console.*`** — `no-console: warn` with only `warn`/`error` allowed; use `Logger.info()`, `Logger.debug()`, `Logger.warn()`, `Logger.error()` instead
- **All promises handled** — `no-floating-promises` and `no-misused-promises` are errors; always `await` or `.catch()`
- **Prefer modern operators** — `prefer-nullish-coalescing` (`??`) and `prefer-optional-chain` (`?.`) enforced; no manual null checks with `||`
- **Strict equality only** — `eqeqeq: always`; never use `==` or `!=`
- **Always use braces** — `curly: all`; no single-line `if`/`else`/`for`/`while` without `{}`
- **`const` by default** — `prefer-const` and `no-var` enforced; only use `let` when reassignment is needed
- **Arrow callbacks** — `prefer-arrow-callback`; no `function` keyword in callbacks
- **Prettier enforced** — double quotes, 2-space indent, semicolons, trailing comma es5, LF endings, 80 char width, always parenthesize arrow params
- **PascalCase files/classes** — `CRTFilter.ts` exports `class CRTFilter`; test files: `CRTFilter.test.ts`
- **UPPER_SNAKE_CASE constants** — `AVAILABLE_FILTERS`, `FILTER_PARAM_DEFS`, `MAX_CONSECUTIVE_ERRORS`
- **JSDoc on public APIs** — block comment with `@param` and `@returns` on all exported methods and classes
- **Pre-commit hooks** — Husky runs lint-staged (eslint --fix + prettier --write on TS/CSS/HTML/JSON, markdownlint --fix on MD) followed by full `test:run`

### Development Workflow Rules

- **`validate` is the full check** — runs `type-check && test:run && lint && lint:md && format:check` in sequence; must pass clean before merge
- **E2E verification on story/tech-spec completion** — after implementing a story or tech-spec, run `npm run test:e2e` to verify no E2E regressions; if the change affects filters, UI controls, presets, WebGL, or the rendering pipeline, update or add E2E tests accordingly
- **When to update E2E tests** — new filter: add to `getFilterTypes()`/`getWebGLFilterTypes()` arrays in `filter-helpers.ts`; new preset: add to preset test arrays in `filters-cpu.spec.ts` and `filters-gpu.spec.ts`; new UI control: add helper in `filter-helpers.ts`; changed `__TEST_APP__` hook: update all specs using it
- **E2E completion checklist** — (1) `npm run validate` passes (unit tests + lint + format), (2) `npm run test:e2e` passes (95 E2E tests), (3) both `tsconfig.json` and `e2e/tsconfig.json` type-check clean
- **Build is type-check first** — `tsc && vite build`; TypeScript errors block bundling
- **GitHub Pages base path** — Vite base set to `/Js-CameraExperiment/`; all asset paths must be relative
- **Single HTML file** — all CSS is inline in `index.html`; no CSS modules, no separate stylesheets
- **`_bmad*/` directories excluded** — from `tsconfig.json` (`exclude`), ESLint (`ignores`), and coverage; never import from these
- **Coverage reporters** — text + html + json + cobertura; output in `/coverage` (gitignored)
- **No runtime dependencies** — `devDependencies` only in `package.json`; the app has zero npm runtime deps

### Critical Don't-Miss Rules

- **Never use truthiness for control flow** — `if (str)` / `if (count)` / `if (obj)` all fail ESLint; always use explicit comparisons (`!== null`, `!== undefined`, `.length > 0`, `!== 0`)
- **Never use `console.log`** — use `Logger.info()` / `.debug()` / `.warn()` / `.error()`; `Logger.debug()` is dev-only (checks `import.meta.env.DEV`)
- **Never skip `validateImageData()`** — mandatory first line in every filter `apply()` method
- **Avoid allocations in filter `apply()`** — runs at 30-60 FPS; reuse buffers as instance properties (see `CRTFilter.bloomBuffer` pattern)
- **`data[i]!` is required and safe** — `noUncheckedIndexedAccess` forces `!` on pixel array access; loop bounds guarantee in-range
- **Never hardcode filter display names** — always use `I18n.t().filters.{type}` for user-facing names
- **French is UI default** — `<html lang="fr">`; both `fr` and `en` translations required for all strings
- **Adding a new filter requires 7+ files** — types union, `AVAILABLE_FILTERS`, filter class, test, i18n entries (both languages), `main.ts` registration; optionally WebGL variant and parameter definitions; update E2E filter type arrays in `e2e/helpers/filter-helpers.ts`
- **No `instanceof` on ImageData** — causes strict-boolean-expressions error; rely on TypeScript type system instead
- **`StoredSettings.version` must be `6`** — `SettingsStorage.load()` rejects any other version; increment only when schema changes

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

_Last Updated: 2026-02-28_

- **No `instanceof` on ImageData** — causes strict-boolean-expressions error; rely on TypeScript type system instead
- **`StoredSettings.version` must be `6`** — `SettingsStorage.load()` rejects any other version; increment only when schema changes
