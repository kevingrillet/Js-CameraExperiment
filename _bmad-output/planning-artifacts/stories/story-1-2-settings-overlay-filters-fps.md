# Story 1.2: Settings Overlay, Filters & FPS

Status: done

## Story

As a user,
I want a settings panel with filter selection, FPS counter, and aspect ratio control,
so that I can configure the application experience.

## Acceptance Criteria

1. **Given** the page loads, **When** the user hovers, **Then** gear icon and GitHub Corner appear; moving mouse off hides them (AC: V1-AC13)
2. **Given** gear is clicked, **When** panel opens, **Then** it shows source selector, 9 filters, FPS toggle, aspect ratio (AC: V1-AC13)
3. **Given** a filter is selected, **When** applied, **Then** real-time at 30+ FPS (AC: V1-AC5–AC12)
4. **Given** FPS toggle checked, **Then** green counter with black stroke at bottom-left (AC: V1-AC14)
5. **Given** aspect ratio changed to Cover, **Then** image fills canvas with cropping (AC: V1-AC16)

## Tasks / Subtasks

- [x] Task 1: Create SettingsOverlay with auto-hide gear button (AC: #1, #2)
- [x] Task 2: Create GitHubCorner component with auto-hide (AC: #1)
- [x] Task 3: Implement 9 filters: None, Invert, MotionDetection, Pixelate, CRT, Rotoscope, EdgeDetection, NightVision, VHS (AC: #3)
- [x] Task 4: Add FPS toggle in settings panel (AC: #4)
- [x] Task 5: Add aspect ratio radio buttons (Contain/Cover) (AC: #5)

## Dev Notes

- Each filter implements the Filter interface with apply(ImageData): ImageData
- validateImageData() input validation for all filters
- Auto-hide via mouseleave/mouseenter DOM events

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-application-filtres-video-temps-reel.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- 9 initial filters implemented with unit tests
- Auto-hide UI with timer-based panel management
- GitHub Corner with link to repo

### File List

- src/ui/SettingsOverlay.ts (created)
- src/ui/GitHubCorner.ts (created)
- src/filters/Filter.ts (created)
- src/filters/NoneFilter.ts (created)
- src/filters/InvertFilter.ts (created)
- src/filters/MotionDetectionFilter.ts (created)
- src/filters/PixelateFilter.ts (created)
- src/filters/CRTFilter.ts (created)
- src/filters/RotoscopeFilter.ts (created)
- src/filters/EdgeDetectionFilter.ts (created)
- src/filters/NightVisionFilter.ts (created)
- src/filters/VHSFilter.ts (created)
- src/types/index.ts (created)
