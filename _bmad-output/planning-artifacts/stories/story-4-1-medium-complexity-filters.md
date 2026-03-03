# Story 4.1: Medium-Complexity Filters (ASCII, Glitch, Oil Painting, Sobel Rainbow)

Status: done

## Story

As a user,
I want ASCII art, Glitch, Oil Painting and Sobel Rainbow filters,
so that I can apply artistic and stylized effects to my video feed.

## Acceptance Criteria

1. **Given** "ASCII" selected, **Then** downsampled grid with character mapping (`.:-=+*#%@`) at 30+ FPS (AC: V4-AC1–AC5)
2. **Given** "Glitch" selected, **Then** random RGB offsets + scan lines + random triggers at 60+ FPS (AC: V4-AC6–AC10)
3. **Given** "Oil Painting" selected, **Then** radius-based most frequent intensity bin at 15+ FPS 640×480 (AC: V4-AC11–AC16)
4. **Given** "Sobel Rainbow" selected, **Then** Sobel edge + gradient→hue colour mapping at 50+ FPS (AC: V4-AC17–AC22)
5. **Given** 17 filters loaded, **Then** alphabetical sort, correct FR/EN labels, NoneFilter first (AC: V4-AC23–AC27)

## Tasks / Subtasks

- [x] Task 1: Create AsciiFilter with grid downsampling and character map (AC: #1)
- [x] Task 2: Create GlitchFilter with random offsets + scan lines (AC: #2)
- [x] Task 3: Create OilPaintingFilter with radius-based intensity bins (AC: #3)
- [x] Task 4: Extract SobelOperator utility for shared use (AC: #4)
- [x] Task 5: Create SobelRainbowFilter with gradient→hue mapping (AC: #4)
- [x] Task 6: Refactor EdgeDetectionFilter & RotoscopeFilter to use SobelOperator (AC: #5)
- [x] Task 7: Register 4 filters, add translations, run tests (AC: #5)

## Dev Notes

- SobelOperator extracted as shared utility (used by EdgeDetection, Rotoscope, SobelRainbow)
- OilPaintingFilter is CPU-heavy; 15 FPS target at 640×480
- GlitchFilter uses frame counter modulo for random trigger timing

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v4-medium-complexity-filters.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- SobelOperator refactor improved code reuse across 3 filters
- OilPainting validated at target FPS with radius=3

### File List

- src/filters/AsciiFilter.ts (created)
- src/filters/GlitchFilter.ts (created)
- src/filters/OilPaintingFilter.ts (created)
- src/filters/SobelRainbowFilter.ts (created)
- src/utils/SobelOperator.ts (created)
- src/filters/EdgeDetectionFilter.ts (modified – use SobelOperator)
- src/filters/RotoscopeFilter.ts (modified – use SobelOperator)
- src/filters/**tests**/AsciiFilter.test.ts (created)
- src/filters/**tests**/GlitchFilter.test.ts (created)
- src/filters/**tests**/OilPaintingFilter.test.ts (created)
- src/filters/**tests**/SobelRainbowFilter.test.ts (created)
- src/types/index.ts (modified)
- src/main.ts (modified)
- src/i18n/translations.ts (modified)
