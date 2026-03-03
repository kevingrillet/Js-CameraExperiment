---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/implementation-artifacts/tech-spec-application-filtres-video-temps-reel.md
  - _bmad-output/implementation-artifacts/tech-spec-v2-download-pause-controls.md
  - _bmad-output/implementation-artifacts/tech-spec-v3-high-impact-filters.md
  - _bmad-output/implementation-artifacts/tech-spec-v4-medium-complexity-filters.md
  - _bmad-output/implementation-artifacts/tech-spec-v5-advanced-filters.md
  - _bmad-output/implementation-artifacts/tech-spec-v6-dynamic-filter-parameters-advanced-features.md
---

# Js-CameraExperiment - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Js-CameraExperiment, decomposing the requirements from the tech specs (V1–V6) into implementable stories organized by user value.

## Requirements Inventory

### Functional Requirements

- FR1: Real-time video source selection (webcam, image upload)
- FR2: Canvas 2D render pipeline with requestAnimationFrame
- FR3: 21 video filters with pixel-based image processing
- FR4: FPS counter with toggle visibility
- FR5: Download filtered image as PNG
- FR6: Pause/Play with visual overlay
- FR7: Aspect ratio mode (Contain/Cover)
- FR8: Internationalization FR/EN
- FR9: Dynamic filter parameters (39 sliders)
- FR10: Filter stacking (max 5 simultaneous)
- FR11: Preset system (5 built-in presets)
- FR12: WebGL GPU acceleration (20 shader filters)
- FR13: LocalStorage settings persistence
- FR14: Browser compatibility detection
- FR15: Smooth transitions between filter changes (300ms crossfade)
- FR16: WebGL context loss auto-fallback

### Non-Functional Requirements

- NFR1: 30+ FPS at 1080p for all filters
- NFR2: TypeScript strict mode, zero `any` types
- NFR3: ESLint zero warnings, Prettier formatted
- NFR4: 500+ unit tests, 80%+ coverage on filters
- NFR5: Zero-allocation render loops (buffer reuse)
- NFR6: Memory leak prevention (cleanup lifecycle)
- NFR7: Graceful error recovery (max 10 consecutive errors)

### FR Coverage Map

| FR    | Epic | Stories           |
| ----- | ---- | ----------------- |
| FR1   | 1    | 1.1               |
| FR2   | 1    | 1.1, 1.2          |
| FR3   | 1-4  | 1.2, 2.1, 3.1, 4.1 |
| FR4   | 1    | 1.2               |
| FR5   | 2    | 2.1               |
| FR6   | 2    | 2.1               |
| FR7   | 1    | 1.2               |
| FR8   | 1    | 1.3               |
| FR9   | 5    | 5.1               |
| FR10  | 5    | 5.2               |
| FR11  | 5    | 5.3               |
| FR12  | 6    | 6.1               |
| FR13  | 5    | 5.4               |
| FR14  | 6    | 6.2               |
| FR15  | 6    | 6.3               |
| FR16  | 6    | 6.3               |

## Epic List

1. **Epic 1: Foundation** — Core application with render pipeline, UI overlay, 9 initial filters, i18n
2. **Epic 2: User Controls** — Download PNG, Pause/Play with overlay, keyboard shortcuts
3. **Epic 3: High-Impact Filters** — Sepia, Blur, Chromatic Aberration, Thermal (4 filters)
4. **Epic 4: Advanced Filters** — Medium-complexity (ASCII, Glitch, OilPainting, SobelRainbow) + Show-off (Vignette, ComicBook, DepthOfField, Kaleidoscope)
5. **Epic 5: Dynamic Parameters & Stacking** — 39 parameter sliders, filter stacking, presets, LocalStorage persistence
6. **Epic 6: GPU Acceleration & Polish** — WebGL shaders, browser compatibility, smooth transitions, context loss fallback

---

## Epic 1: Foundation

Build the core application: webcam/image source, Canvas 2D render pipeline, 9 initial filters, settings overlay with auto-hide, GitHub Corner, FPS counter, aspect ratio toggle, and FR/EN internationalization.

### Story 1.1: Video Source & Render Pipeline

As a user,
I want to see my webcam feed displayed fullscreen on a canvas,
So that I can use the application to experiment with video filters.

**Acceptance Criteria:**

**Given** the application loads
**When** the user grants webcam permission
**Then** the webcam feed appears on a fullscreen canvas with no black bars (default contain mode)

**Given** multiple webcams are available
**When** the user selects a different webcam from the dropdown
**Then** the video source switches without page reload

**Given** the user wants to use a static image
**When** they upload a JPG/PNG/GIF/WEBP image
**Then** the image replaces the webcam feed and filters apply to it

**Given** webcam access is denied or unavailable
**When** an error occurs
**Then** a user-friendly error message is shown with help instructions

### Story 1.2: Settings Overlay, Filters & FPS

As a user,
I want a settings panel with filter selection, FPS counter, and aspect ratio control,
So that I can configure the application experience.

**Acceptance Criteria:**

**Given** the page loads
**When** the user hovers over the page
**Then** a gear icon and GitHub Corner appear; moving the mouse off the window hides them

**Given** the gear icon is clicked
**When** the settings panel opens
**Then** it shows source selector, filter dropdown (9 filters), FPS toggle, and aspect ratio radio buttons

**Given** the user selects a filter from the dropdown
**When** a filter is chosen (e.g., Invert, CRT, VHS)
**Then** the selected filter is applied in real-time at 30+ FPS

**Given** the FPS toggle is checked
**When** rendering continues
**Then** a green FPS counter with black stroke appears at the bottom-left

**Given** the user changes aspect ratio to "Cover"
**When** the source is wider than the canvas
**Then** the image fills the canvas with cropping (no black bars)

### Story 1.3: Internationalization FR/EN

As a French or English speaking user,
I want to switch the UI language,
So that I can use the app in my preferred language.

**Acceptance Criteria:**

**Given** the settings panel is open
**When** the user clicks the 🇫🇷 or 🇬🇧 flag
**Then** all labels, filter names, error messages, and tooltips switch language instantly

**Given** the application starts
**When** the default language is French
**Then** all UI text appears in French

---

## Epic 2: User Controls

Add download functionality and pause/play toggle to enhance user interaction.

### Story 2.1: Download & Pause Controls

As a user,
I want to download the current filtered image and pause the video stream,
So that I can capture specific moments and examine them in detail.

**Acceptance Criteria:**

**Given** the auto-hide UI is visible
**When** the user clicks the download button (📥)
**Then** a PNG file is saved with filename `camera-experiment-{filter}-{timestamp}.png`

**Given** a download is in progress
**When** the user clicks download again
**Then** the duplicate download is prevented (button disabled)

**Given** the video is playing
**When** the user clicks the canvas (outside UI controls)
**Then** the video pauses, a semi-transparent ⏸️ icon appears centered, FPS shows "PAUSED"/"EN PAUSE"

**Given** the video is paused
**When** the user clicks the canvas or presses Spacebar
**Then** playback resumes and the pause overlay hides

**Given** the user presses the S key
**When** the video is playing or paused
**Then** the current canvas state is downloaded as PNG

---

## Epic 3: High-Impact Filters

Add 4 visually impressive filters with optimized pixel processing.

### Story 3.1: Sepia, Blur, Chromatic Aberration & Thermal Filters

As a user,
I want additional high-quality filters (Sepia, Blur, Chromatic Aberration, Thermal),
So that I can apply more creative visual effects to my video feed.

**Acceptance Criteria:**

**Given** the user selects "Sepia"
**When** the filter is applied
**Then** the image gets warm brownish tones via RGB matrix transform at 100+ FPS

**Given** the user selects "Blur"
**When** the filter is applied
**Then** a soft focus effect via 5×5 separable box blur appears at 30+ FPS with buffer reuse

**Given** the user selects "Chromatic Aberration"
**When** the filter is applied
**Then** RGB channels are offset by ±3px creating color fringing at 80+ FPS

**Given** the user selects "Thermal"
**When** the filter is applied
**Then** luminance maps to a thermal palette (blue→purple→red→yellow→white) at 70+ FPS

**Given** the filter dropdown
**When** language is switched
**Then** all 4 new filter names appear correctly in FR and EN, alphabetically sorted

---

## Epic 4: Advanced Filters

Add 8 more filters: 4 medium-complexity "cool factor" filters and 4 advanced "show-off" filters.

### Story 4.1: Medium-Complexity Filters (ASCII, Glitch, OilPainting, SobelRainbow)

As a user,
I want creative medium-complexity filters,
So that I can apply unique artistic effects like ASCII art and glitch effects.

**Acceptance Criteria:**

**Given** the user selects "ASCII Art"
**When** the filter is applied
**Then** the image renders as Matrix-style ASCII characters mapped by luminance at 40+ FPS

**Given** the user selects "Glitch / Datamosh"
**When** the filter is applied
**Then** intermittent visual glitches with temporal artifacts appear at 30+ FPS

**Given** the user selects "Oil Painting"
**When** the filter is applied
**Then** posterized colors with edge-preserving bilateral blur appear at 25+ FPS

**Given** the user selects "Sobel Rainbow"
**When** the filter is applied
**Then** edge detection with HSL-orientation coloring appears at 30+ FPS

**Given** filter cleanup
**When** the user switches away from any V4 filter
**Then** buffers are released and cleanup() is called to prevent memory leaks

### Story 4.2: Show-Off Filters (Vignette, ComicBook, DepthOfField, Kaleidoscope)

As a user,
I want advanced show-off filters for impressive visual demonstrations,
So that I can apply professional-quality effects like depth of field and kaleidoscope.

**Acceptance Criteria:**

**Given** the user selects "Artistic Vignette"
**When** the filter is applied
**Then** edges darken radially (center >95% brightness, corners ≥40% darkened) at 55+ FPS

**Given** the user selects "Comic Book / Halftone"
**When** the filter is applied
**Then** posterized colors (8 levels) with thick black Sobel outlines appear at 25+ FPS

**Given** the user selects "Depth of Field"
**When** the filter is applied
**Then** center stays sharp while edges blur progressively (max 9×9 kernel) at 20+ FPS

**Given** the user selects "Kaleidoscope"
**When** the filter is applied
**Then** 6 radially mirrored segments via polar coordinate transformation appear at 25+ FPS

**Given** the application after V4+V5
**When** counting available filters
**Then** 21 filters are listed in the dropdown, alphabetically sorted per language

---

## Epic 5: Dynamic Parameters & Stacking

Add real-time parameter tuning, filter stacking, presets, and settings persistence.

### Story 5.1: Dynamic Filter Parameters (39 Sliders)

As a user,
I want to adjust filter parameters with sliders in real-time,
So that I can fine-tune visual effects to my preference.

**Acceptance Criteria:**

**Given** a filter with parameters is selected (e.g., Blur with kernelSize, blurStrength)
**When** the user adjusts a slider
**Then** the filter updates immediately without frame drops

**Given** an advanced settings button
**When** clicked
**Then** a full modal with accordion per filter shows all 39 parameters

**Given** a parameter slider
**When** the user enters an out-of-range value
**Then** the value is clamped to the allowed min/max range

**Given** a "Reset" button per filter
**When** clicked
**Then** all parameters for that filter return to their default values

### Story 5.2: Filter Stacking (Max 5)

As a user,
I want to combine multiple filters simultaneously,
So that I can create complex layered effects.

**Acceptance Criteria:**

**Given** the "Add Filter" button in the stack
**When** the user adds a filter
**Then** a removable filter chip appears and the filter is applied in sequence

**Given** 5 filters already stacked
**When** the user tries to add a 6th
**Then** a toast warning "Maximum 5 filters in stack" appears

**Given** a filter already in the stack
**When** the user tries to add the same FilterType
**Then** a toast warning "{filter} is already in the stack" appears

**Given** 5 heavy filters stacked (e.g., OilPainting + DoF + Blur + Glitch + CRT)
**When** rendering
**Then** the app maintains ≥15 FPS at 720p without crashing

### Story 5.3: Presets System

As a user,
I want one-click preset configurations,
So that I can quickly apply curated filter combinations.

**Acceptance Criteria:**

**Given** the presets dropdown
**When** the user selects "Cinematic"
**Then** DoF + Vignette are loaded with specific parameter values

**Given** a preset is loaded
**When** the user adjusts a parameter slider
**Then** the modified value takes effect (presets are a starting point, not locked)

**Given** the 5 presets
**When** each is applied
**Then** Cinematic, Vintage Film, Cyberpunk, Surveillance, Dream Sequence all render correctly

### Story 5.4: LocalStorage Persistence

As a user,
I want my settings saved automatically,
So that my configuration is restored when I return.

**Acceptance Criteria:**

**Given** the user changes filter stack, parameters, WebGL toggle, or language
**When** 500ms pass without another change (debounce)
**Then** settings are saved to localStorage

**Given** the page is reloaded
**When** the app starts
**Then** filter stack, parameters, and toggles are fully restored from localStorage

**Given** localStorage is full (quota exceeded)
**When** a save is attempted
**Then** a warning toast appears but the app continues working

**Given** stored JSON is corrupted
**When** settings load fails
**Then** defaults are used silently (no crash)

**Given** the browser tab is closing
**When** beforeunload fires
**Then** settings are flushed immediately (no 500ms wait)

---

## Epic 6: GPU Acceleration & Polish

Add WebGL GPU acceleration, browser compatibility detection, smooth transitions, and context loss handling.

### Story 6.1: WebGL GPU Acceleration

As a user,
I want to enable GPU-accelerated rendering,
So that filters run faster with hardware acceleration.

**Acceptance Criteria:**

**Given** the WebGL toggle is off (default)
**When** all filters are rendered
**Then** Canvas2D CPU versions are used

**Given** the WebGL toggle is enabled
**When** a filter with a WebGL shader is active (20 filters supported)
**Then** the GPU shader version is used with measurable speedup

**Given** WebGL is not supported by the browser
**When** the toggle is shown
**Then** it is disabled with a "WebGL not available" red note

**Given** WebGL context is lost during rendering
**When** the callback fires
**Then** the app auto-disables GPU toggle, shows a toast, and falls back to Canvas2D

### Story 6.2: Browser Compatibility Detection

As a user visiting with an older or incompatible browser,
I want to be warned about missing features,
So that I understand potential limitations.

**Acceptance Criteria:**

**Given** Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
**When** the app loads
**Then** no compatibility warning appears

**Given** Safari
**When** the app loads
**Then** a toast warns about OilPainting/DepthOfField performance degradation

**Given** a browser missing MediaStream, Canvas 2D, or localStorage APIs
**When** the compatibility check runs
**Then** missing APIs are listed in a warning toast

### Story 6.3: Smooth Transitions & Error Resilience

As a user,
I want filter changes to crossfade smoothly,
So that visual transitions feel polished rather than abrupt.

**Acceptance Criteria:**

**Given** smooth transitions is enabled (default)
**When** the filter stack changes
**Then** a 300ms pixel-level crossfade blends the old and new filter outputs

**Given** smooth transitions is disabled via the UI toggle
**When** the filter stack changes
**Then** the switch is instant (no crossfade)

**Given** a filter crashes during rendering
**When** the error boundary catches it
**Then** the filter is skipped, logged, and the rest of the stack continues

**Given** 10 consecutive render errors occur
**When** the error threshold is reached
**Then** the render loop stops and an error callback notifies the user
