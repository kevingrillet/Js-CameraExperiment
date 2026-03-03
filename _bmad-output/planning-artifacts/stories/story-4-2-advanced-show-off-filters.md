# Story 4.2: Advanced Show-Off Filters (Vignette, Comic Book, Depth of Field, Kaleidoscope)

Status: done

## Story

As a user,
I want Vignette, Comic Book, Depth of Field and Kaleidoscope filters,
so that I can apply advanced artistic effects to my video feed.

## Acceptance Criteria

1. **Given** "Vignette" selected, **Then** radial darkening from center via distance formula at 60+ FPS (AC: V5-AC1–AC4)
2. **Given** "Comic Book" selected, **Then** posterize + edge overlay + halftone at 25+ FPS (AC: V5-AC5–AC10)
3. **Given** "Depth of Field" selected, **Then** center sharp, edges blurred via distance mask + multi-pass blur at 20+ FPS (AC: V5-AC11–AC16)
4. **Given** "Kaleidoscope" selected, **Then** triangular sector mirrored N-fold radially at 30+ FPS (AC: V5-AC17–AC22)
5. **Given** 21 total filters, **Then** alphabetical sort, FR/EN names, all tests passing (AC: V5-AC23–AC28)

## Tasks / Subtasks

- [x] Task 1: Create VignetteFilter with radial distance evaluation (AC: #1)
- [x] Task 2: Create ComicBookFilter with posterize + edge + halftone pipeline (AC: #2)
- [x] Task 3: Create DepthOfFieldFilter with focus mask + multi-pass blur (AC: #3)
- [x] Task 4: Create KaleidoscopeFilter with polar→sector→mirror transforms (AC: #4)
- [x] Task 5: Register 4 filters, add translations, integration test (AC: #5)
- [x] Task 6: Write comprehensive unit tests for all 4 filters (AC: all)

## Dev Notes

- ComicBookFilter combines 3 sub-passes: posterize, Sobel edge, halftone dots
- DepthOfFieldFilter: multi-pass box blur for quality, focus region configurable
- KaleidoscopeFilter: uses atan2/sqrt for polar transform, configurable segment count
- VignetteFilter: simple but effective; pre-computed distance cache

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v5-advanced-filters.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- All 4 filters meet or exceed FPS targets
- ComicBook halftone pattern uses configurable dot grid
- 21 filters total in application after this story

### File List

- src/filters/VignetteFilter.ts (created)
- src/filters/ComicBookFilter.ts (created)
- src/filters/DepthOfFieldFilter.ts (created)
- src/filters/KaleidoscopeFilter.ts (created)
- src/filters/**tests**/VignetteFilter.test.ts (created)
- src/filters/**tests**/ComicBookFilter.test.ts (created)
- src/filters/**tests**/DepthOfFieldFilter.test.ts (created)
- src/filters/**tests**/KaleidoscopeFilter.test.ts (created)
- src/types/index.ts (modified)
- src/main.ts (modified)
- src/i18n/translations.ts (modified)
