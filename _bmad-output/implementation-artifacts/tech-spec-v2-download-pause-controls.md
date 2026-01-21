---
title: 'Download & Pause Controls for Camera Experiment'
slug: 'v2-download-pause-controls'
created: '2026-01-21'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript 5.3.3', 'Canvas 2D API', 'Blob API', 'Keyboard Events', 'Vite 7.3.1', 'RequestAnimationFrame']
files_to_modify: ['src/ui/SettingsOverlay.ts', 'src/core/RenderPipeline.ts', 'src/main.ts', 'src/i18n/translations.ts', 'src/types/index.ts', 'index.html']
code_patterns: ['Module-based classes with private state', 'TypeScript strict mode with no any', 'Event-driven callbacks pattern', 'Auto-hide UI with mouseleave/mouseenter', 'Centralized Logger utility', 'I18n singleton pattern', 'Error recovery with consecutive error tracking']
test_patterns: ['Manual testing via dev server', 'Vitest for unit tests (optional for utils)']
---

# Tech-Spec: Download & Pause Controls for Camera Experiment

**Created:** 2026-01-21

## Overview

### Problem Statement

Users cannot capture the current filtered image or examine a frozen frame. They must take browser screenshots which include the UI overlay, resulting in poor quality captures. Additionally, there's no way to pause the video stream to examine a specific moment in detail.

### Solution

Add two essential controls to enhance user experience:

1. **Download button** (📥) positioned below the settings gear icon, allowing users to capture the current canvas state as a PNG file with the active filter applied
2. **Pause/Play toggle** activated by clicking anywhere on the canvas (except UI controls), with a centered semi-transparent pause icon overlay when paused

Both features integrate seamlessly with the existing auto-hide behavior and internationalization system.

### Scope

**In Scope:**

- Download button positioned below gear icon with same auto-hide behavior
- Canvas capture to PNG with filename format: `camera-experiment-{filterName}-{timestamp}.png`
- Loading spinner during canvas→PNG conversion (100-500ms for large resolutions)
- Click on canvas to toggle pause/play (excluding UI control areas)
- Semi-transparent pause icon (⏸️) overlay centered on screen when video paused
- Keyboard shortcuts:
  - `Spacebar` for pause/play toggle
  - `S` key for save/download
- Internationalized UI labels and messages (FR/EN)
- FPS counter stops updating when paused (shows last value or "PAUSED")
- Error handling for download failures (quota exceeded, CORS issues)

**Out of Scope:**

- Additional image formats (JPG, WEBP) - PNG only for V2
- YouTube-style pause button at bottom-center (Option B) - defer to future if needed
- Batch downloads or video recording
- Quality/compression settings for PNG output
- Customizable filename patterns

## Context for Development

### Codebase Patterns

**Status:** Extending existing V1 codebase (production-ready, zero known issues, 4 adversarial reviews passed)

**Architecture Details from Investigation:**

**1. Core Component Structure**

- **RenderPipeline** (src/core/RenderPipeline.ts):
  - Owns canvas + offscreenCanvas for double buffering
  - `animationId: number | null` for requestAnimationFrame tracking
  - `isRendering: boolean` flag for frame skipping (prevents render overlap)
  - `consecutiveErrors: number` with `MAX_CONSECUTIVE_ERRORS = 10` threshold
  - `onErrorCallback?: (error: Error) => void` for critical error notification
  - Cleanup pattern: `stop()` cancels animationId, removes window listeners
  
- **SettingsOverlay** (src/ui/SettingsOverlay.ts):
  - `container: HTMLElement` created via `createOverlay()` and appended to body
  - `isVisible: boolean` + `hideTimeout: number | null` for auto-hide logic
  - Callbacks pattern: `SettingsCallbacks` interface with typed callbacks
  - HTML structure: `.gear-button` + `.settings-panel` with `.open` class toggle
  - Auto-hide: 200ms debounce via `setTimeout`, triggered by document mouseleave
  
- **GitHubCorner** (src/ui/GitHubCorner.ts):
  - Same auto-hide pattern as SettingsOverlay (synchronized behavior)
  - Positioned top-left, uses `.hidden` class with opacity + transform transition
  - No callbacks, simple link with SVG icon

- **App** (src/main.ts):
  - Orchestrates all components, wires callbacks
  - Async initialization pattern with try-catch + error recovery
  - Status message system: `showStatus()`, `hideStatus()`, `showRetryButton()`
  - Rollback pattern for webcam switching failures (stores `currentWebcamDeviceId`)

**2. TypeScript Strict Mode Constraints**

- **tsconfig.json**: `strict: true` + 13 additional strict flags
- **No `any` allowed**: All types must be explicit
- **Null safety**: `strictNullChecks: true`, use optional chaining (`?.`)
- **Unused checks**: `noUnusedLocals` + `noUnusedParameters` enabled
- **Array safety**: `noUncheckedIndexedAccess: true` (arrays return `T | undefined`)

**3. Auto-hide UI Pattern (Critical for Download Button)**

- **Trigger**: `document.addEventListener('mouseleave')` + `mouseenter`
- **Debounce**: 200ms timeout before hiding (via `window.setTimeout`)
- **State tracking**: Each component tracks `isVisible: boolean` + `hideTimeout: number | null`
- **Cleanup**: `clearTimeout(hideTimeout)` in cancelHideTimer before setting new timeout
- **CSS transitions**: Opacity + transform with 0.3s ease
- **Classes**: `.hidden` class added/removed (not inline styles)

**4. I18n System (Critical for New Labels)**

- **I18n singleton** (src/i18n/translations.ts):
  - `static currentLanguage: Language = 'fr'` (default French)
  - `static t(): Translations` returns current language object
  - `static setLanguage(lang)` + `notifyListeners()` for reactive updates
  - All UI components subscribe to language changes (e.g., `settingsOverlay.updateLabels()`)
- **Translation structure**: Nested objects (e.g., `t.errors.renderError`)
- **Template variables**: `{message}`, `{size}` replaced via `.replace()`
- **New translations needed**: `downloading`, `paused`, `download`, `downloadImage`, error messages for download failures

**5. Error Handling & Logging**

- **Logger utility** (src/utils/Logger.ts):
  - `Logger.info()`, `Logger.warn()`, `Logger.error()`, `Logger.debug()`
  - Development-only console output (checks `import.meta.env.DEV`)
  - Stores last 100 entries in memory, `export()` for debugging
  - ALL error messages must be i18n-compliant (no hardcoded strings)
- **Error recovery pattern**: Try-catch in critical paths, consecutive error tracking
- **User feedback**: `showStatus(title, text, isError, helpText)` for user-facing errors

**6. Event Handling Patterns**

- **Callbacks over events**: Components use callback props (e.g., `onWebcamSelected`)
- **Event cleanup**: Must remove listeners in cleanup/destroy methods
- **Event targets**: Type narrowing with `as HTMLElement`, null checks
- **Stop propagation**: `e.stopPropagation()` when needed (e.g., gear button click)

**7. Memory Management (Critical - Zero Allocations in Render Loop)**

- **Buffer reuse**: RenderPipeline reuses `imageDataBuffer` (checks dimensions, reuses if same)
- **Filter cleanup**: All filters implement `cleanup()` to release buffers
- **No allocations**: NEVER allocate ImageData/Uint8ClampedArray inside requestAnimationFrame
- **Render loop discipline**: Check `isRendering` flag, skip frame if still processing

**New Patterns to Implement for V2:**

**1. Canvas Capture Utility**

- Encapsulate `canvas.toBlob('image/png')` in utility class
- Handle async blob conversion with Promise
- Generate filename: `camera-experiment-{filterName}-{timestamp}.png`
- Timestamp format: `YYYYMMDD-HHmmss` via Date methods
- Trigger download via temporary `<a>` element with `download` attribute

**2. Pause State Management**

- RenderPipeline needs `private isPaused: boolean = false`
- `pause()` method: Cancel animationId, keep last frame visible
- `resume()` method: Restart requestAnimationFrame loop
- `isPaused()` getter: Query current state
- FPS counter: Stop updating when paused OR show "PAUSED" text

**3. Keyboard Event Handling**

- Global `document.addEventListener('keydown')` in App constructor
- Listen for `event.key === ' '` (Spacebar) and `event.key === 's'` or `event.key === 'S'`
- `event.preventDefault()` for Spacebar to prevent page scroll
- Cleanup: Store bound handler, remove in App cleanup/destroy
- Check `event.target`: Ignore if user is typing in input field

**4. Click Zone Detection**

- Canvas click listener: `canvas.addEventListener('click')`
- Check if click target is canvas itself (not descendant of UI overlay)
- Use `event.target === canvas` or `!event.target.closest('.settings-overlay')`
- Prevent pause when clicking gear button, panel, or GitHub corner

**5. Loading State Management**

- Download button needs disabled state during capture
- Show spinner/loading indicator overlay centered on screen
- Hide after blob download complete
- Use same pattern as status message (show/hide with transition)

### Technical Preferences

- **Blob API over data URLs**: Use `canvas.toBlob()` for better memory efficiency than `toDataURL()`
- **Progressive enhancement**: Download button disabled during capture, visual feedback for user actions
- **Accessibility**: Keyboard shortcuts for both download and pause actions
- **Minimal UI intrusion**: Pause overlay only visible when paused, fades smoothly

### Files to Reference

| File | Purpose | Status | Key Details |
| ---- | ------- | ------ | ----------- |
| [src/ui/SettingsOverlay.ts](src/ui/SettingsOverlay.ts) | Settings UI with auto-hide, add download button below gear | **To modify** | 409 lines, `createOverlay()` generates HTML string, callbacks via constructor, `updateLabels()` for i18n |
| [src/core/RenderPipeline.ts](src/core/RenderPipeline.ts) | Render loop, add pause/resume methods, expose canvas getter | **To modify** | 356 lines, `animationId` tracking, error recovery with consecutive errors, `cleanup()` removes listeners |
| [src/main.ts](src/main.ts) | App initialization, wire download + pause event handlers | **To modify** | 323 lines, orchestrates all components, async `start()`, rollback pattern for errors |
| [src/i18n/translations.ts](src/i18n/translations.ts) | Translations FR/EN, add download/pause labels + error messages | **To modify** | 200 lines, nested objects, template vars via `.replace()`, `setLanguage()` triggers `notifyListeners()` |
| [src/types/index.ts](src/types/index.ts) | Type definitions | **Reference** | 100 lines, exports FilterType, AspectRatioMode, AppConfig |
| [index.html](index.html) | HTML structure, add pause overlay element, download button CSS | **To modify** | 342 lines, inline styles in `<style>` tag, status message structure |
| [src/utils/Logger.ts](src/utils/Logger.ts) | Centralized logging | **Reference only** | 200 lines, `Logger.error()` for all errors, dev-only console output |
| [src/core/FPSCounter.ts](src/core/FPSCounter.ts) | FPS calculation | **Reference** | 100 lines, `update()` called every frame, `getFPS()` returns average |
| [src/ui/GitHubCorner.ts](src/ui/GitHubCorner.ts) | GitHub link with auto-hide | **Reference** | 106 lines, same auto-hide pattern as SettingsOverlay, 200ms debounce |
| [tsconfig.json](tsconfig.json) | TypeScript strict config | **Reference** | Strict mode + 13 extra flags, no any allowed |
| [package.json](package.json) | Dependencies + scripts | **Reference** | Vite 7.3.1, TS 5.3.3, ESLint 9, Prettier, Vitest, `validate` script runs all checks |

**New files to create:**

| File | Purpose | Lines (Est.) |
| ---- | ------- | ------------ |
| `src/utils/CanvasCapture.ts` | Utility for canvas→blob conversion, download trigger, filename generation with timestamp | ~100 lines |

### Technical Decisions

**Investigation Findings - Key Constraints:**

**1. Download Implementation**

- **Canvas.toBlob() approach**:
  - Use `canvas.toBlob('image/png', callback)` for memory efficiency over `toDataURL()`
  - Blob API is async (callback-based) - wrap in Promise for cleaner async/await
  - File size for 1920x1080 PNG: ~500KB-2MB (depends on content complexity)
  - Conversion time: 100-500ms measured on V1 codebase (acceptable with spinner)
- **Filename generation**:
  - Pattern: `camera-experiment-{filterName}-{timestamp}.png`
  - Timestamp: `YYYYMMDD-HHmmss` format via Date methods (e.g., `20260121-143052`)
  - FilterName: From `currentFilter` (need to track current filter type in RenderPipeline or App)
  - Use `I18n.t().filters[filterType]` for translated filter name? NO - keep filename in English for consistency
- **Download trigger**:
  - Create temporary `<a>` element: `document.createElement('a')`
  - Set `href = URL.createObjectURL(blob)` and `download = filename`
  - Call `a.click()` to trigger browser download
  - Cleanup: `URL.revokeObjectURL(href)` after download to free memory
- **Loading indicator**:
  - Show centered spinner overlay during toBlob() conversion
  - Use existing status message infrastructure OR create new `.download-spinner` element
  - Position: `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`
  - Hide on blob completion or error
- **Error handling**:
  - CORS errors: Unlikely (no external images in current implementation)
  - Quota exceeded: Possible on mobile browsers with low storage (10MB limit check)
  - toBlob failure: Rare, but must catch and show i18n error via `showStatus()`
  - All errors logged via `Logger.error()` with context

**2. Pause/Play Implementation**

- **RenderPipeline state management**:
  - Add `private isPaused: boolean = false`
  - `pause()`: Call `cancelAnimationFrame(this.animationId)`, set `isPaused = true`, keep last frame on canvas
  - `resume()`: Set `isPaused = false`, call `this.render()` to restart loop
  - `isPaused()`: Getter to query state from external components
  - **Critical**: Don't clear canvas when paused - last frame remains visible
- **FPS counter behavior when paused**:
  - Option A: Stop calling `fpsCounter.update()` - FPS shows last value before pause (simpler)
  - Option B: Show "PAUSED" text instead of FPS number (better UX)
  - **Decision**: Option B - modify `drawFPS()` to check `isPaused` state
- **Pause overlay UI**:
  - HTML: `<div id="pause-overlay" class="pause-overlay hidden">⏸️</div>` in index.html
  - CSS: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 80px; opacity: 0.6; pointer-events: none; z-index: 500;`
  - Show/hide: Toggle `.hidden` class with opacity + scale transitions (0.3s ease)
  - Z-index: Below UI overlays (1000) but above canvas (0)
- **Click detection logic**:
  - Canvas click: `canvas.addEventListener('click', (e) => ...)`
  - Check target: `if (event.target !== canvas) return;` to exclude child elements
  - Alternative: `if (event.target.closest('.settings-overlay, .github-corner')) return;`
  - **Decision**: Use `event.target === canvas` for simplicity
- **Keyboard shortcuts**:
  - Global listener: `document.addEventListener('keydown', handleKeyDown)` in App constructor
  - Spacebar: `if (event.key === ' ')` → toggle pause, `event.preventDefault()` to stop page scroll
  - S key: `if (event.key === 's' || event.key === 'S')` → trigger download (case-insensitive)
  - Ignore if typing: `if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;`
  - **REQUIRED**: Store bound handler reference in private field, implement cleanup method to call `document.removeEventListener(keyboardHandler)` to prevent memory leaks

**3. UI Integration**

- **Download button positioning**:
  - Position: 70px below gear button (`.gear-button` is 56px height + 14px gap)
  - HTML structure: Add `<button class="download-button">` after `.gear-button` in SettingsOverlay
  - Same parent: `.settings-overlay` container (both gear and download button)
  - CSS: Mirror gear button styles (56x56px circle, same background/border)
  - SVG icon: Download icon (📥) using same 28x28px SVG viewBox pattern
- **Auto-hide synchronization**:
  - Download button inherits auto-hide from parent `.settings-overlay`
  - No separate event listeners needed - controlled by container `.hidden` class
  - Same 200ms debounce, same mouseleave/mouseenter triggers
- **Download button states**:
  - Normal: Same hover effects as gear button (rotate or scale)
  - Disabled: `pointer-events: none; opacity: 0.5;` during capture
  - Loading: Show spinner inside button OR separate overlay (prefer separate for clarity)

**4. Current Filter Tracking**

- **Problem**: RenderPipeline has `currentFilter: Filter` but not `currentFilterType: FilterType`
- **Solution options**:
  - A) Add `currentFilterType: FilterType` to RenderPipeline, update in `setFilter()`
  - B) Track in App class, pass to CanvasCapture utility
  - C) Add `getType(): FilterType` method to Filter interface
- **Decision**: Option B - Track `currentFilterType` in App, already tracks filter map
  - Modify `handleFilterChanged()` to store type: `this.currentFilterType = filterType`
  - Pass to download handler: `CanvasCapture.download(canvas, this.currentFilterType)`

**5. Performance Considerations**

- **Canvas.toBlob() blocking**:
  - toBlob() runs on main thread but is async (doesn't block UI)
  - However, conversion can take 100-500ms for large canva s→ show spinner
  - No render loop impact: Pause is independent, download doesn't affect rendering
- **Memory management**:
  - Blob created by toBlob(): Browser manages, freed after download
  - ObjectURL created: MUST call `URL.revokeObjectURL()` to prevent leak
  - Temporary `<a>` element: No need to append to DOM (click works anyway), garbage collected
- **Pause state**:
  - Paused = zero CPU for rendering (animationFrame cancelled)
  - Last frame: Already in visible canvas, no extra memory
  - Resume: Instant (just restart requestAnimationFrame loop)- **Filter switching while paused**:
  - **Decision**: Paused frame does NOT update when filter changes
  - Rationale: Simpler implementation, avoids complexity of single-frame rendering
  - Behavior: New filter applied immediately when user resumes playback
  - UX trade-off: User must resume to see new filter effect on paused frame## Implementation Plan

### Tasks

#### Phase 1: Canvas Capture Utility

**Task 1**: Create CanvasCapture utility for download functionality

- File: `src/utils/CanvasCapture.ts`
- Action: Create new utility class with static methods for canvas→blob conversion and download triggering
- Implementation:
  - `static async captureCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void>` - Main method wrapping toBlob in Promise
  - `static generateFilename(filterType: FilterType): string` - Generate `camera-experiment-{filterType}-{timestamp}.png` filename
  - `static formatTimestamp(): string` - Format current date as `YYYYMMDD-HHmmss`
    - **Note**: Timestamp precision is 1 second. If multiple downloads occur within the same second, the browser automatically renames duplicates (e.g., file.png → file (1).png) to prevent overwrites.
  - `static triggerDownload(blob: Blob, filename: string): void` - Create temp `<a>` element, set href/download, click, cleanup ObjectURL
    - **CRITICAL**: Wrap download trigger in try-finally to guarantee ObjectURL cleanup even if click() fails
    - Pattern: `try { a.click(); } finally { URL.revokeObjectURL(objectUrl); }`
    - This prevents memory leaks from abandoned ObjectURLs in error scenarios
  - All methods have JSDoc with @param, @returns, @throws
  - Error handling: Try-catch around toBlob, throw descriptive errors
  - Use `Logger.error()` for all errors with context "CanvasCapture"
- Notes: Keep filter type in English for filename consistency (don't use i18n filter names)

#### Phase 2: I18n Labels & Error Messages

**Task 2**: Add French and English translations for download/pause features

- File: `src/i18n/translations.ts`
- Action: Add new translation keys to both `fr` and `en` objects in `translations` record
- Keys to add:

  ```typescript
  interface Translations {
    // ... existing fields ...
    download: string;           // "Télécharger" / "Download"
    downloadImage: string;      // "Télécharger l'image" / "Download Image"
    paused: string;            // "EN PAUSE" / "PAUSED"
    clickToResume: string;     // "Cliquez pour reprendre" / "Click to resume"
    errors: {
      // ... existing error fields ...
      downloadFailed: string;  // "Échec du téléchargement : {message}" / "Download failed: {message}"
      quotaExceeded: string;   // "Espace de stockage insuffisant" / "Insufficient storage space"
    };
  }
  ```

- Notes: Use template variable `{message}` for dynamic error messages

#### Phase 3: RenderPipeline Pause/Resume Methods

**Task 3**: Add pause/resume functionality to RenderPipeline

- File: `src/core/RenderPipeline.ts`
- Action: Add pause state management and control methods
- Changes:
  1. Add private field: `private isPaused: boolean = false;`
  2. Add `pause()` method:
     - If already paused, return early
     - Call `cancelAnimationFrame(this.animationId)` if animationId not null
     - Set `this.animationId = null`
     - Set `this.isPaused = true`
     - **CRITICAL**: Reset `this.consecutiveErrors = 0` to give fresh start on resume (prevents accumulated errors from causing crash)
     - Log with `Logger.info("Render pipeline paused", "RenderPipeline")`
  3. Add `resume()` method:
     - If not paused, return early
     - Set `this.isPaused = false`
     - Call `this.render()` to restart loop
     - Log with `Logger.info("Render pipeline resumed", "RenderPipeline")`
  4. Add `getIsPaused(): boolean` getter returning `this.isPaused`
  5. Add `getCanvas(): HTMLCanvasElement` getter returning `this.canvas` (needed for download)
  6. Modify `drawFPS()` method:
     - Check `if (this.isPaused)` at start
     - If paused, display `I18n.t().paused` instead of FPS number
     - **Style specification**: Use identical rendering as FPS counter:
       - Font: "bold 24px monospace" (same as FPS)
       - Fill color: "#00ff00" (green, same as FPS)
       - Stroke: "#000000" (black) with lineWidth 3 (same outline for visibility)
       - Position: Same bottom-left corner (x=20, y=canvas.height-20)
       - Text format: Just the paused string (e.g., "PAUSED" or "EN PAUSE"), no "FPS" suffix
- Notes: Keep last frame visible when paused (don't clear canvas)

**Task 4**: Expose current filter type in RenderPipeline

- File: `src/core/RenderPipeline.ts`
- Action: Track current filter type for filename generation
- Changes:
  1. Add private field: `private currentFilterType: FilterType = "none";`
  2. Modify `setFilter(filter: Filter)` method:
     - Add parameter: `setFilter(filter: Filter, filterType: FilterType): void`
     - Store type: `this.currentFilterType = filterType;` before cleanup logic
  3. Add getter: `getCurrentFilterType(): FilterType` returning `this.currentFilterType`
- Notes: This allows download utility to access filter type without coupling to Filter interface

#### Phase 4: SettingsOverlay Download Button

**Task 5**: Add download button to SettingsOverlay UI

- File: `src/ui/SettingsOverlay.ts`
- Action: Add download button below gear button with auto-hide behavior
- Changes:
  1. Update `SettingsCallbacks` interface:
     - Add `onDownloadClicked: () => void;` callback
  2. Modify `createOverlay()` method:
     - After gear button SVG, add download button HTML:

       ```html
       <button class="download-button" title="${t.downloadImage}">
         <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
           <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
         </svg>
       </button>
       ```

  3. In `setupEventListeners()`:
     - Query download button: `const downloadButton = this.container.querySelector('.download-button') as HTMLButtonElement;`
     - Add click listener: `downloadButton.addEventListener('click', (e) => { e.stopPropagation(); this.callbacks.onDownloadClicked(); });`
  4. Add `setDownloadEnabled(enabled: boolean): void` method:
     - Query download button: `const downloadButton = this.container.querySelector('.download-button') as HTMLButtonElement;`
     - If enabled: `downloadButton.disabled = false;`
     - If disabled: `downloadButton.disabled = true;`
     - **Note**: The `disabled` attribute automatically triggers `.download-button:disabled` CSS selector defined in Task 6, which handles opacity and pointer-events styling
  5. In `updateLabels()` method:
     - Update download button title attribute with `t.downloadImage`
- Notes:
  - Download button inherits auto-hide from parent `.settings-overlay` container
  - CSS styles for `.download-button` class are defined in Task 6 (index.html inline styles)

#### Phase 5: HTML Structure & CSS

**Task 6**: Add pause overlay element and download button styles to HTML

- File: `index.html`
- Action: Add pause overlay div and CSS for download button + pause overlay
- Changes in `<body>`:
  - After `<canvas id="canvas"></canvas>`, add:

    ```html
    <div id="pause-overlay" class="pause-overlay hidden">
      <div class="pause-icon">⏸️</div>
    </div>
    ```

- Changes in `<style>`:
  1. Add download button CSS after `.gear-button` styles:

     ```css
     .download-button {
       background: rgba(0, 0, 0, 0.7);
       border: 2px solid rgba(255, 255, 255, 0.3);
       border-radius: 50%;
       width: 56px;
       height: 56px;
       display: flex;
       align-items: center;
       justify-content: center;
       cursor: pointer;
       transition: all 0.2s ease;
       color: #fff;
       backdrop-filter: blur(10px);
       margin-top: 14px; /* 70px total from gear top (56 + 14) */
     }
     
     .download-button:hover {
       background: rgba(0, 0, 0, 0.9);
       border-color: rgba(255, 255, 255, 0.5);
       transform: scale(1.1);
     }
     
     .download-button:disabled {
       opacity: 0.5;
       pointer-events: none;
       cursor: not-allowed;
     }
     ```

  2. Add pause overlay CSS after status message styles:

     ```css
     .pause-overlay {
       position: fixed;
       top: 50%;
       left: 50%;
       transform: translate(-50%, -50%);
       z-index: 500;
       pointer-events: none;
       transition: opacity 0.3s ease, transform 0.3s ease;
     }
     
     .pause-overlay.hidden {
       opacity: 0;
       transform: translate(-50%, -50%) scale(0.8);
     }
     
     .pause-overlay .pause-icon {
       font-size: 80px;
       opacity: 0.6;
       text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
     }
     ```

     **Note**: 80px font size chosen for center-screen visibility without dominating the canvas - significantly larger than UI controls (28px download icon, 24px FPS text) to clearly indicate paused state, but with 0.6 opacity to remain subtle.
- Notes: z-index 500 places pause overlay below UI controls (1000) but above canvas

#### Phase 6: Main App Integration

**Task 7**: Wire download functionality in App

- File: `src/main.ts`
- Action: Add download button callback and implement download logic
- Changes:
  1. Add import: `import { CanvasCapture } from "./utils/CanvasCapture";`
  2. Add private field: `private isDownloading: boolean = false;`
  3. In SettingsOverlay constructor callbacks, add:

     ```typescript
     onDownloadClicked: (): void => {
       void this.handleDownloadClick();
     },
     ```

  4. Add `handleDownloadClick()` async method:

     ```typescript
     private async handleDownloadClick(): Promise<void> {
       if (this.isDownloading) return;
       
       const t = I18n.t();
       this.isDownloading = true;
       this.settingsOverlay.setDownloadEnabled(false);
       
       try {
         const canvas = this.renderPipeline.getCanvas();
         const filterType = this.renderPipeline.getCurrentFilterType();
         const filename = CanvasCapture.generateFilename(filterType);
         
         await CanvasCapture.captureCanvas(canvas, filename);
         
         Logger.info(`Image downloaded: ${filename}`, "App");
       } catch (error) {
         Logger.error(
           "Download failed",
           error instanceof Error ? error : new Error(String(error)),
           "App"
         );
         const errorMessage = error instanceof Error ? error.message : t.errors.generic;
         this.showStatus(
           t.errors.downloadFailed.replace("{message}", ""),
           errorMessage,
           true
         );
       } finally {
         this.isDownloading = false;
         this.settingsOverlay.setDownloadEnabled(true);
       }
     }
     ```

- Notes: Download is fast (100-500ms per AC22), button disabled state (opacity 0.5) provides sufficient visual feedback - no need for loading message

**Task 8**: Wire pause/play functionality in App

- File: `src/main.ts`
- Action: Add canvas click and keyboard event handlers for pause/play
- Changes:
  1. Add private fields:
     - `private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;`
     - `private canvasClickHandler: ((event: MouseEvent) => void) | null = null;`
  2. In `constructor()`, after initializing components:
     - Get canvas element (already stored as local var)
     - Setup and store canvas click handler:

       ```typescript
       this.canvasClickHandler = (event: MouseEvent): void => {
         if (event.target === canvas) {
           this.togglePause();
         }
       };
       canvas.addEventListener('click', this.canvasClickHandler);
       ```

       **Note**: `event.target === canvas` check ensures clicks on UI overlays don't trigger pause. The download button is a child of `.settings-overlay`, so clicks on it bubble up but fail the `=== canvas` check, correctly preventing pause.
     - Setup keyboard handler:

       ```typescript
       this.keyboardHandler = (event: KeyboardEvent): void => {
         this.handleKeyDown(event);
       };
       document.addEventListener('keydown', this.keyboardHandler);
       ```

  3. Add `cleanup()` method for proper resource cleanup:

     ```typescript
     public cleanup(): void {
       // Remove keyboard listener
       if (this.keyboardHandler !== null) {
         document.removeEventListener('keydown', this.keyboardHandler);
         this.keyboardHandler = null;
       }
       
       // Remove canvas click listener
       if (this.canvasClickHandler !== null) {
         const canvas = this.renderPipeline.getCanvas();
         canvas.removeEventListener('click', this.canvasClickHandler);
         this.canvasClickHandler = null;
       }
     }
     ```

     **Note**: This method should be called when the app is being torn down to prevent memory leaks from orphaned event listeners.
  4. Add `togglePause()` method:

     ```typescript
     private togglePause(): void {
       const pauseOverlay = document.getElementById('pause-overlay');
       if (pauseOverlay === null) return;
       
       if (this.renderPipeline.getIsPaused()) {
         this.renderPipeline.resume();
         pauseOverlay.classList.add('hidden');
       } else {
         this.renderPipeline.pause();
         pauseOverlay.classList.remove('hidden');
       }
     }
     ```

  5. Add `handleKeyDown()` method:

     ```typescript
     private handleKeyDown(event: KeyboardEvent): void {
       // Ignore if typing in input field
       if (
         event.target instanceof HTMLInputElement ||
         event.target instanceof HTMLTextAreaElement
       ) {
         return;
       }
       
       // Spacebar for pause/play
       if (event.key === ' ') {
         event.preventDefault();
         this.togglePause();
       }
       
       // S key for download (only if not already downloading)
       if ((event.key === 's' || event.key === 'S') && !this.isDownloading) {
         void this.handleDownloadClick();
       }
     }
     ```

  6. Update `handleFilterChanged()` to pass filterType to RenderPipeline:

     ```typescript
     private handleFilterChanged(filterType: FilterType): void {
       const filter = this.filters.get(filterType);
       if (filter === undefined) return;
       
       this.renderPipeline.setFilter(filter, filterType);
     }
     ```

- Notes:
  - preventDefault() on Spacebar prevents page scroll, keyboard handler ignores input fields
  - cleanup() method is public to allow external teardown if needed (e.g., during tests or app reload)
  - Stored handler references (keyboardHandler, canvasClickHandler) enable proper removeEventListener (must be same function reference)
  - Download shortcut 'S' checks `isDownloading` flag to prevent race conditions with simultaneous download attempts

#### Phase 7: Type Definitions

**Task 9**: Export FilterType from types module (if not already exported)

- File: `src/types/index.ts`
- Action: Verify FilterType is exported (already is based on investigation)
- Notes: No changes needed - FilterType already exported, just verify for completeness

### Acceptance Criteria

#### Download Functionality

- [ ] **AC1**: Given the app is running with a filter active, when the user hovers over the settings area, then the download button (📥) appears below the gear button with the same fade-in animation
- [ ] **AC2**: Given the download button is visible, when the user clicks it, then the button becomes disabled (opacity 0.5) during the download process
- [ ] **AC3**: Given the download is in progress, when the canvas is converted to PNG, then the browser downloads a file named `camera-experiment-{filterType}-YYYYMMDD-HHmmss.png` (e.g., `camera-experiment-invert-20260121-143052.png`)
- [ ] **AC4**: Given the download completes successfully, when the file is saved, then the download button is re-enabled
- [ ] **AC5**: Given a download is in progress, when the user tries to trigger another download (via button click or keyboard shortcut), then the request is ignored (button disabled with opacity 0.5, keyboard shortcut 'S' has no effect) to prevent simultaneous downloads
- [ ] **AC6**: Given the download fails (e.g., quota exceeded), when an error occurs, then an error message appears with the translated error description
- [ ] **AC7**: Given the user presses the `S` key, when not typing in an input field AND no download is in progress, then the download is triggered exactly as if clicking the download button (respects `isDownloading` flag)
- [ ] **AC8**: Given the app is running, when the user's mouse leaves the browser window, then both the gear button and download button disappear with smooth transition after 200ms

#### Pause/Play Functionality

- [ ] **AC9**: Given the video is playing, when the user clicks anywhere on the canvas (not on UI controls), then the video pauses and a semi-transparent pause icon (⏸️) appears centered on screen
- [ ] **AC10**: Given the video is paused, when the user clicks on the canvas again, then the video resumes and the pause icon fades out
- [ ] **AC11**: Given the user presses the Spacebar key, when not typing in an input field, then the video toggles between paused and playing
- [ ] **AC12**: Given the Spacebar is pressed, when the page would normally scroll, then the default scroll behavior is prevented (no page jump)
- [ ] **AC13**: Given the user is typing in an input field (e.g., file upload dialog open), when Spacebar or S key is pressed, then pause/download actions do NOT trigger (typing takes precedence)
- [ ] **AC14**: Given the video is paused, when FPS counter is enabled, then the FPS display shows "EN PAUSE" (FR) or "PAUSED" (EN) instead of a number
- [ ] **AC15**: Given the video is paused on a specific frame, when resumed, then the video continues from that exact frame without jumping or resetting
- [ ] **AC16**: Given the user clicks on the gear button or settings panel, when the click occurs, then the pause action does NOT trigger (click target filtering works)

#### Integration & Edge Cases

- [ ] **AC17**: Given the video is paused, when the user triggers download, then the downloaded PNG captures the paused frame exactly as displayed on screen
- [ ] **AC18**: Given the user switches filters while paused, when a new filter is selected, then the paused frame remains unchanged (showing the old filter) until the user resumes playback
- [ ] **AC19**: Given the user switches from webcam to image source while paused, when the source changes, then the pause state is maintained with the new source
- [ ] **AC20**: Given the app language is changed (FR ↔ EN), when the change occurs, then all download/pause UI labels update immediately (download button title, pause overlay text, FPS "PAUSED" text)
- [ ] **AC21**: Given a render error occurs while paused, when the error threshold is reached, then the pause state is maintained and the error message is shown to the user

#### Performance & Quality

- [ ] **AC22**: Given a 1920x1080 canvas, when download is triggered, then the PNG conversion completes within 500ms and the file size is under 5MB
- [ ] **AC23**: Given the video is paused for an extended time (30+ seconds), when resumed, then the video continues smoothly without memory leaks or performance degradation
- [ ] **AC24**: Given the code is complete, when `npm run type-check` is executed, then TypeScript compilation succeeds with zero errors
- [ ] **AC25**: Given the code is complete, when `npm run lint` is executed, then ESLint returns exit code 0 with zero errors/warnings
- [ ] **AC26**: Given the code is complete, when `npm run format:check` is executed, then Prettier confirms all files are correctly formatted
- [ ] **AC27**: Given all changes are implemented, when `npm run validate` is executed, then the complete validation pipeline (type-check + test + lint + format) passes successfully

## Additional Context

### Dependencies

**External Dependencies:**

- **None** - All features use native browser APIs:
  - `HTMLCanvasElement.toBlob()` - Canvas to Blob conversion (supported in all modern browsers)
  - `URL.createObjectURL()` / `URL.revokeObjectURL()` - Blob URL management
  - `document.createElement('a')` with `download` attribute - Trigger file download
  - `KeyboardEvent` API - Keyboard shortcuts
  - `MouseEvent` API - Canvas click detection

**Internal Dependencies:**

- Existing `Logger` utility for error logging
- Existing `I18n` system for all UI text
- Existing `RenderPipeline` for canvas access and render control
- Existing `SettingsOverlay` for UI integration
- Existing auto-hide pattern from `GitHubCorner` + `SettingsOverlay`

**Task Dependencies:**

- Task 1 (CanvasCapture) must be complete before Task 7 (App download integration)
- Task 2 (I18n) should be complete before Task 5 (SettingsOverlay UI) for labels
- Task 3 (RenderPipeline pause) must be complete before Task 8 (App pause integration)
- Task 6 (HTML/CSS) must be complete before Task 8 (pause overlay show/hide)

### Testing Strategy

**Unit Tests (Optional - Not Required for V2):**

- `CanvasCapture.formatTimestamp()` - Verify YYYYMMDD-HHmmss format
- `CanvasCapture.generateFilename()` - Verify filename pattern with filter types
- Mock canvas.toBlob() to test error handling

**Manual Testing Checklist:**

1. **Download Button UI:**
   - [ ] Button appears below gear on mouse enter
   - [ ] Button disappears on mouse leave (200ms delay)
   - [ ] Button hover effect works (scale 1.1)
   - [ ] Button click triggers download
   - [ ] Button disabled during download
   - [ ] Download icon SVG renders correctly

2. **Download Functionality:**
   - [ ] File downloads with correct name pattern
   - [ ] Filename includes correct filter type (test all 9 filters)
   - [ ] Timestamp format is correct (YYYYMMDD-HHmmss)
   - [ ] Downloaded PNG matches visible canvas
   - [ ] Large canvas (1920x1080) downloads successfully
   - [ ] Small canvas (640x480) downloads successfully
   - [ ] Loading message shows during conversion
   - [ ] Error handling for toBlob failure (simulate by stubbing)

3. **Pause/Play UI:**
   - [ ] Canvas click toggles pause
   - [ ] Pause icon appears centered when paused
   - [ ] Pause icon fades out when resumed
   - [ ] Pause icon is semi-transparent (opacity 0.6)
   - [ ] Clicking gear/panel/github corner does NOT pause

4. **Pause/Play Functionality:**
   - [ ] Spacebar toggles pause/play
   - [ ] Spacebar prevents page scroll
   - [ ] S key triggers download
   - [ ] Keyboard shortcuts ignored when typing in input
   - [ ] Paused video shows last frame (not black)
   - [ ] FPS counter shows "PAUSED" when paused
   - [ ] Resuming continues from paused frame
   - [ ] Filter changes work while paused
   - [ ] Source changes (webcam→image) work while paused

5. **Integration:**
   - [ ] Download while paused captures paused frame
   - [ ] Multiple pause/resume cycles work smoothly
   - [ ] Language change updates all labels
   - [ ] No memory leaks after 20+ pause/resume cycles
   - [ ] No memory leaks after 10+ downloads

6. **Quality Gates:**
   - [ ] `npm run type-check` passes
   - [ ] `npm run lint` passes
   - [ ] `npm run format:check` passes
   - [ ] `npm run validate` passes

### Notes

**High-Risk Items (Pre-Mortem Analysis):**

1. **Canvas.toBlob() browser compatibility**
   - Risk: Older browsers may not support toBlob
   - Mitigation: App already targets modern Chrome (acceptable risk)
   - Fallback: Could add polyfill if needed (out of scope for V2)

2. **Filename timestamp conflicts**
   - Risk: Multiple downloads in same second overwrite each other
   - Mitigation: Browser auto-renames duplicates (file.png → file (1).png)
   - Future: Add milliseconds to timestamp if becomes issue

3. **Large PNG file sizes**
   - Risk: Complex filtered images may exceed 5-10MB
   - Mitigation: Already using PNG (compressed), browser handles large files
   - User education: Show file size in future version

4. **Keyboard shortcuts conflict**
   - Risk: Spacebar/S may conflict with other browser shortcuts
   - Mitigation: preventDefault on Spacebar, check for input focus
   - Acceptable: S key unlikely to conflict

5. **Pause state during source switching**
   - Risk: Pause state may be lost when changing webcam/image
   - Mitigation: Pause state is independent of source, should persist
   - Test: Manual testing with source switches while paused

**Known Limitations:**

- **PNG only**: No JPG/WEBP support in V2 (planned for future)
- **No download progress bar**: toBlob() doesn't provide progress events
- **No batch download**: Single image at a time only
- **No filename customization**: Pattern is hardcoded
- **Pause overlay not customizable**: Fixed icon, size, position

**Future Considerations (Out of Scope for V2):**

- **V2.1 Enhancements:**
  - Download format selection (PNG/JPG/WEBP)
  - Download quality slider for JPG
  - Customizable filename pattern
  - Download history / gallery view
  - Batch download (capture every N frames)
  
- **V2.2 Video Recording:**
  - Record video with filter applied
  - Use MediaRecorder API
  - MP4/WEBM export
  - Duration limit and file size management

- **V2.3 Advanced Pause:**
  - Frame-by-frame scrubbing (for video sources)
  - Timeline with thumbnails
  - Pause at specific timestamp
  - Loop playback between pause points
