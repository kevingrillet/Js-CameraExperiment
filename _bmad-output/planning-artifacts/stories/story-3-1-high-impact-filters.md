# Story 3.1: Sepia, Blur, Chromatic Aberration & Thermal Filters

Status: done

## Story

As a user,
I want additional high-quality filters (Sepia, Blur, Chromatic Aberration, Thermal),
so that I can apply more creative visual effects to my video feed.

## Acceptance Criteria

1. **Given** "Sepia" selected, **Then** warm brownish tones via RGB matrix at 100+ FPS (AC: V3-AC1–AC5)
2. **Given** "Blur" selected, **Then** 5×5 separable box blur with buffer reuse at 30+ FPS (AC: V3-AC6–AC11)
3. **Given** "Chromatic Aberration" selected, **Then** RGB offset ±3px at 80+ FPS (AC: V3-AC12–AC16)
4. **Given** "Thermal" selected, **Then** luminance→thermal palette (256 entries) at 70+ FPS (AC: V3-AC17–AC22)
5. **Given** filter dropdown, **Then** 13 filters alphabetically sorted with FR/EN names (AC: V3-AC23–AC30)

## Tasks / Subtasks

- [x] Task 1: Create SepiaFilter with RGB matrix transformation (AC: #1)
- [x] Task 2: Create BlurFilter with separable box blur + buffer reuse (AC: #2)
- [x] Task 3: Create ChromaticAberrationFilter with RGB channel shifting (AC: #3)
- [x] Task 4: Create ThermalFilter with luminance LUT mapping (AC: #4)
- [x] Task 5: Register 4 filters in types, main.ts, translations (AC: #5)
- [x] Task 6: Write unit tests for all 4 filters (AC: all)

## Dev Notes

- SepiaFilter: Stateless, no buffer needed
- BlurFilter: Buffer reuse pattern with dimension change detection
- ChromaticAberrationFilter: Converted to buffer reuse after review (was allocating 498 MB/s)
- ThermalFilter: Pre-computed 256-entry LUT for palette lookup

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v3-high-impact-filters.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- ChromaticAberrationFilter required post-review fix for memory allocation
- All 4 filters validated at target FPS benchmarks
- Zero-allocation render loops confirmed

### File List

- src/filters/SepiaFilter.ts (created)
- src/filters/BlurFilter.ts (created)
- src/filters/ChromaticAberrationFilter.ts (created)
- src/filters/ThermalFilter.ts (created)
- src/filters/**tests**/SepiaFilter.test.ts (created)
- src/filters/**tests**/BlurFilter.test.ts (created)
- src/filters/**tests**/ChromaticAberrationFilter.test.ts (created)
- src/filters/**tests**/ThermalFilter.test.ts (created)
- src/types/index.ts (modified)
- src/main.ts (modified)
- src/i18n/translations.ts (modified)
