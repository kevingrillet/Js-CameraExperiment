# Story 7.1: Black & White Filter (CPU + WebGL)

Status: todo

## Story

As a user,
I want a pure Black & White filter with dithering options,
so that I can reduce my video feed to strict two-tone black or white pixels with artistic control over the threshold and grain.

## Acceptance Criteria

1. **Given** "Black & White" selected (default: amount mode, no dithering, threshold 128), **Then** every pixel is `#000000` or `#ffffff` based on luminance (L = 0.299·R + 0.587·G + 0.114·B) at 100+ FPS on Canvas 2D (AC: V7-AC1)
2. **Given** `thresholdMode = 1` (random), **Then** per-pixel threshold is uniform random [0,255] each frame, producing animated film-grain two-tone effect (AC: V7-AC2)
3. **Given** `thresholdMode = 2` (bluerandom), **Then** per-pixel threshold sampled from fixed-seed 64×64 LCG blue-noise matrix (tiled), producing lower-pattern noise than `random` (AC: V7-AC3)
4. **Given** `ditheringMode !== 0` (bayer2 / bayer4 / bayer8 / bayer16), **Then** Bayer ordered dithering takes precedence over `thresholdMode`; threshold determined by normalised Bayer matrix value at pixel coordinates (AC: V7-AC4)
5. **Given** WebGL toggle enabled, **Then** WebGL 2.0 / GLSL ES 3.00 path used, producing equivalent two-tone output (minor pixel-boundary divergence at exact threshold for blue-noise mode is acceptable) (AC: V7-AC5)
6. **Given** language switched FR ↔ EN, **Then** filter name and all three parameter labels (thresholdMode, threshold, ditheringMode) appear correctly in both languages (AC: V7-AC6)
7. **Given** user switches away from the filter, **When** `cleanup()` is called, **Then** `originalDataBuffer` is released and no memory leak occurs (AC: V7-AC7)
8. **Given** `"bw"` added to `ALL_FILTER_TYPES` in `filter-helpers.ts`, **Then** both `filters-cpu.spec.ts` and `filters-gpu.spec.ts` smoke loops cover the filter automatically (AC: V7-AC8)
9. **Given** application after V7, **When** counting available filters, **Then** 22 filters listed alphabetically, with "Black & White" / "Noir et Blanc" between "Blur" and "Chromatic Aberration" (AC: V7-AC9)

## Tasks / Subtasks

- [ ] Task 1: Update `src/types/index.ts` — add `"bw"` to `FilterType`, add `{ type: "bw" }` to `AVAILABLE_FILTERS`, add `BlackWhiteFilterParams` interface, extend `FilterParameters` union and `FilterParametersMap`, add `FILTER_PARAM_DEFS.bw` (AC: #9)
- [ ] Task 2: Create `src/filters/BlackWhiteFilter.ts` — CPU Canvas 2D implementation with buffer reuse (`originalDataBuffer`), Bayer matrices as `readonly` class constants, blue-noise LCG matrix generated once in constructor (AC: #1, #2, #3, #4, #7)
- [ ] Task 3: Create `src/filters/__tests__/BlackWhiteFilter.test.ts` — unit tests for all threshold modes, all dithering modes, buffer reuse, cleanup (AC: #1–#4, #7)
- [ ] Task 4: Create `src/filters/webgl/BlackWhiteFilterWebGL.ts` — WebGL 2.0 / GLSL ES 3.00 implementation: custom `apply()` binding two texture units, GLSL bit-interleaving Bayer function, blue-noise 64×64 R8 texture on TEXTURE1, `u_time` uniform for random mode (AC: #5)
- [ ] Task 5: Update `src/filters/webgl/__tests__/WebGLFilters.test.ts` — add `describe` block for `BlackWhiteFilterWebGL`: construct / `setParameters` / apply-throws / `cleanup` (AC: #5)
- [ ] Task 6: Update `src/i18n/translations.ts` — add FR/EN entries for filter name "Noir et Blanc" / "Black & White" and parameter labels for `thresholdMode`, `threshold`, `ditheringMode` (AC: #6)
- [ ] Task 7: Update `e2e/helpers/filter-helpers.ts` — add `"bw"` to `ALL_FILTER_TYPES` and `WEBGL_FILTER_TYPES` (AC: #8)
- [ ] Task 8: Update `README.md` — filter count 21→22, add BW entry to filter list, update file tree (AC: #9)

## Dev Notes

- `BlackWhiteFilter` CPU: Bayer matrices stored as `private readonly number[]` flat arrays (2×2, 4×4, 8×8, 16×16), normalised to `[0, 1)`. Blue-noise 64×64 matrix generated in constructor with seeded LCG (`seed = 0x12345678`, `A=1664525, C=1013904223, M=4294967296`). Buffer reuse: reallocate `originalDataBuffer` only when `data.length` changes.
- `BlackWhiteFilterWebGL`: must call `initContext(true)` (prefer WebGL 2.0) and use `#version 300 es` custom vertex shader (replaces `STANDARD_VERTEX_SHADER`). Bayer implemented via GLSL bit-interleaving loop (`n = log2(matrixSize)`, `shift` descends from MSB pair). Blue noise uploaded as 64×64 R8/LUMINANCE texture with `NEAREST` filtering on TEXTURE1.
- Active mode logic: `ditheringMode !== 0` → Bayer; else `thresholdMode 0` → fixed `threshold`; `thresholdMode 1` → GLSL hash rand + `u_time`; `thresholdMode 2` → blue-noise texture sample.
- Known CPU/GPU divergence: CPU normalises `state/2^32 * 255`; GPU packs `state>>24` → sampled as `byte/255`. Factor ≈ 256/255 (~0.4%). Pixels at exact threshold boundary may flip. Acceptable for a perceptual effect.
- UI grey-out (follow-up): When `ditheringMode > 0`, the `threshold` and `thresholdMode` sliders should be disabled in `AdvancedSettingsModal` — this is a UI-layer concern, out of scope for this story.

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v7-black-white-filter.md]

## Dev Agent Record

### Agent Model Used

_to be filled on completion_

### Completion Notes List

_to be filled on completion_

### File List

- src/types/index.ts (modified)
- src/filters/BlackWhiteFilter.ts (created)
- src/filters/**tests**/BlackWhiteFilter.test.ts (created)
- src/filters/webgl/BlackWhiteFilterWebGL.ts (created)
- src/filters/webgl/**tests**/WebGLFilters.test.ts (modified)
- src/i18n/translations.ts (modified)
- e2e/helpers/filter-helpers.ts (modified)
- README.md (modified)
