# Story 1.1: Video Source & Render Pipeline

Status: done

## Story

As a user,
I want to see my webcam feed displayed fullscreen on a canvas,
so that I can use the application to experiment with video filters.

## Acceptance Criteria

1. **Given** the application loads, **When** the user grants webcam permission, **Then** the webcam feed appears on a fullscreen canvas (AC: V1-AC1)
2. **Given** multiple webcams are available, **When** the user selects a different webcam, **Then** the video source switches without reload (AC: V1-AC2)
3. **Given** the user uploads a JPG/PNG/GIF/WEBP image, **When** selected, **Then** it replaces the webcam feed (AC: V1-AC3)
4. **Given** webcam access is denied, **When** error occurs, **Then** user-friendly error message with help instructions (AC: V1-AC4)

## Tasks / Subtasks

- [x] Task 1: Create VideoSource class with webcam/image support (AC: #1, #2, #3)
- [x] Task 2: Create RenderPipeline with requestAnimationFrame loop (AC: #1)
- [x] Task 3: Create FPSCounter utility (AC: #1)
- [x] Task 4: Create error handling with help text display (AC: #4)
- [x] Task 5: Create index.html with fullscreen canvas and status overlays

## Dev Notes

- VideoSource wraps MediaStream API + Image loading
- RenderPipeline uses offscreen canvas for filter processing
- Error recovery with retry button and contextual help text

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-application-filtres-video-temps-reel.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- All source management implemented with multi-webcam support
- Error messages with bilingual help instructions
- Retry mechanism on failure

### File List

- src/video/VideoSource.ts (created)
- src/core/RenderPipeline.ts (created)
- src/core/FPSCounter.ts (created)
- src/main.ts (modified)
- index.html (modified)
