# Story 2.1: Download & Pause Controls

Status: done

## Story

As a user,
I want to download the current filtered image and pause the video stream,
so that I can capture specific moments and examine them in detail.

## Acceptance Criteria

1. **Given** auto-hide UI visible, **When** download button clicked, **Then** PNG saved as `camera-experiment-{filter}-{timestamp}.png` (AC: V2-AC1–AC3)
2. **Given** download in progress, **When** clicked again, **Then** duplicate prevented (AC: V2-AC5)
3. **Given** video playing, **When** canvas clicked, **Then** pauses with ⏸️ overlay and FPS shows "PAUSED" (AC: V2-AC9–AC11)
4. **Given** video paused, **When** canvas clicked or Spacebar pressed, **Then** resumes (AC: V2-AC12–AC13)
5. **Given** user presses S key, **Then** current canvas downloaded as PNG (AC: V2-AC7)

## Tasks / Subtasks

- [x] Task 1: Create CanvasCapture utility with canvas.toBlob() → download (AC: #1)
- [x] Task 2: Add download button below gear icon with auto-hide (AC: #1, #2)
- [x] Task 3: Add pause/play toggle on canvas click (AC: #3, #4)
- [x] Task 4: Create pause overlay HTML/CSS (AC: #3)
- [x] Task 5: Add keyboard shortcuts (Spacebar, S key) (AC: #4, #5)
- [x] Task 6: Add RenderPipeline.pause()/resume() methods (AC: #3, #4)

## Dev Notes

- CanvasCapture uses canvas.toBlob('image/png') → Blob → URL.createObjectURL → link.click()
- Pause overlay with semi-transparent background and centered icon
- Input fields excluded from keyboard shortcuts

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v2-download-pause-controls.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- Download works during pause (captures frozen frame)
- FPS shows localized "PAUSED"/"EN PAUSE"
- Duplicate download prevention via isDownloading flag

### File List

- src/utils/CanvasCapture.ts (created)
- src/ui/SettingsOverlay.ts (modified)
- src/core/RenderPipeline.ts (modified)
- src/main.ts (modified)
- index.html (modified)
