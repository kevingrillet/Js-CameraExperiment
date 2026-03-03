---
title: 'V6 - Dynamic Filter Parameters & Advanced Features'
slug: 'v6-dynamic-filter-parameters-advanced-features'
created: '2026-01-23'
status: 'Completed'
implemented_date: '2026-01-24'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript 5.3.3', 'Canvas 2D API', 'WebGL 2.0', 'LocalStorage API', 'Vite 7.3.1', 'Vitest 2.1.0', 'ESLint 9 flat config', 'Prettier']
files_to_modify: ['src/types/index.ts', 'src/filters/Filter.ts', 'src/filters/BlurFilter.ts', 'src/filters/GlitchFilter.ts', 'src/filters/VignetteFilter.ts', 'src/filters/DepthOfFieldFilter.ts', 'src/ui/SettingsOverlay.ts', 'src/i18n/translations.ts', 'src/main.ts', 'src/core/RenderPipeline.ts', 'README.md', 'package.json']
code_patterns: ['Filter Strategy with setParameters() optional method', 'LocalStorage for settings persistence (v6 schema)', 'Callback-based UI events (SettingsCallbacks interface)', 'Buffer reuse pattern (zero allocations in render loop)', 'Cleanup pattern for filters with buffers', 'TypeScript strict mode (no any, null safety)', 'Observer pattern for parameter updates', 'Modal UI with dynamic slider generation']
test_patterns: ['Vitest + Happy-DOM environment', 'Mock ImageData with Uint8ClampedArray', 'Temporal state testing (frame TTL, buffer persistence)', 'Math.random mocking for deterministic tests', 'Coverage target 80%+']
---

# Tech-Spec: V6 - Dynamic Filter Parameters & Advanced Features

**Created:** 2026-01-23

## Overview

### Problem Statement

Users cannot adjust filter intensity or customize effects - all 39 identified parameters across 17 filters are hardcoded constants. The application lacks advanced features mentioned in V1-V5 out-of-scope sections: filter stacking/layering, visual animations, GPU acceleration for heavy filters, and browser compatibility detection/warnings.

Current limitations:

- **No parameter control**: Users stuck with preset values (e.g., Blur strength always 5, Vignette strength always 0.6)
- **Single filter only**: Cannot combine filters (e.g., Vignette + Sepia for vintage look)
- **Static effects**: No animations (Kaleidoscope doesn't rotate, no smooth transitions)
- **CPU-only rendering**: Heavy filters (Blur, DoF, OilPainting) could benefit from GPU acceleration
- **Silent failures**: No detection/warning for incompatible browsers (pre-2016)

### Solution

Implement a comprehensive V6 feature set with 4 major components:

1. **Dynamic Filter Parameters System** (39 sliders total):
   - Hybrid UI approach: Contextual sliders in main panel + "Advanced Settings" modal with all parameters
   - Observer pattern for real-time parameter updates
   - LocalStorage persistence (restore user preferences on reload)

2. **Filter Stacking & Presets**:
   - Manual stacking: Add/remove filters dynamically, visualize pipeline
   - 5 predefined presets: Cinematic, Vintage Film, Cyberpunk, Surveillance, Dream Sequence
   - Sequential application order

3. **Visual Animations**:
   - Kaleidoscope auto-rotation (toggle on/off, speed adjustable)
   - Glitch temporal variation (randomized intensity over time)
   - Smooth filter transitions (300ms crossfade when switching)

4. **WebGL Acceleration & Browser Detection**:
   - Global "Use GPU Acceleration" toggle (fallback to Canvas2D if unavailable)
   - Startup browser compatibility check (MediaStream, Canvas2D, Blob APIs)
   - Warning message for incompatible browsers + README documentation

### Scope

**In Scope:**

**1. Dynamic Filter Parameters (39 sliders, 17 filters)**

**Phase 1 - Simple Filters (17 sliders, 11 filters):**

- AsciiFilter: Character Size (4-16, default 8)
- BlurFilter: Blur Strength (3-15, default 5)
- ChromaticAberrationFilter: Aberration Offset (1-10, default 3)
- ComicBookFilter: Edge Sensitivity (30-200, default 100)
- EdgeDetectionFilter: Edge Sensitivity (10-150, default 50)
- KaleidoscopeFilter: Number of Segments (3-12, default 6)
- SobelRainbowFilter: Edge Sensitivity (10-150, default 50)
- VignetteFilter: Vignette Strength (0.0-1.0, default 0.6)
- DepthOfFieldFilter: Focus Zone Size (0.1-0.6, default 0.3), Blur Strength (3-15, default 9)
- NightVisionFilter: Grain Intensity (0.0-0.5, default 0.12), Vignette Strength (0.0-1.0, default 0.4)
- PixelateFilter: Horizontal Resolution (80-320, default 160), Vertical Resolution (72-288, default 144)

**Phase 2 - Complex Filters (22 sliders, 6 filters):**

- CRTFilter: Scanline Darkness (0.0-1.0, default 0.3), Scanline Spacing (1-6, default 2), Bloom Intensity (0.0-0.5, default 0.15)
- MotionDetectionFilter: Motion Sensitivity (10-100, default 30), Noise Filter (0-10, default 3), Motion Trail Duration (0.5-0.98, default 0.85)
- OilPaintingFilter: Color Levels (4-16, default 8), Brush Size (3-9, default 5), Edge Preservation (30-150, default 80)
- RotoscopeFilter: Color Levels (3-12, default 6), Edge Sensitivity (10-100, default 30), Edge Darkness (0.0-1.0, default 0.8)
- VHSFilter: Glitch Frequency (0.0-0.1, default 0.02), Tracking Lines Frequency (0.0-0.5, default 0.15), Grain Intensity (0.0-0.3, default 0.08)
- GlitchFilter: Line Shift Frequency (0.0-0.3, default 0.05), RGB Glitch Frequency (0.0-0.5, default 0.15), RGB Glitch Intensity (3-20, default 8), Block Corruption Frequency (0.0-0.2, default 0.05), Glitch Min Duration (1-5, default 2), Glitch Max Duration (2-10, default 5)

**UI Implementation:**

- Main settings panel: Contextual sliders for active filter(s) only
- "Advanced Settings" button → Modal with all 39 sliders organized in collapsible sections (one per filter)
- Sliders disabled/grayed when filter inactive
- Reset button per filter (restore defaults)
- Global "Reset All" button in advanced modal
- Real-time updates via Observer pattern (no "Apply" button needed)

**2. Filter Stacking & Presets**

**Manual Stacking:**

- UI: "Filter Pipeline" section showing active filters as chips/pills
- Add filter: Dropdown "Add Filter" (appears when current ≠ "none")
- Remove filter: "X" button on each chip
- Order: Sequential application (first added = first applied)
- Limit: Max 5 filters in stack (performance consideration)
- **Constraint**: Each FilterType can appear ONLY ONCE in the stack (no duplicate filter types with different params)
  - Rationale: Filters are single-instance objects reused across stack. Supporting multi-instance of same type requires cloning/factory pattern (defer to V7)
  - Example VALID: ["vignette", "blur", "sepia"]
  - Example INVALID: ["blur", "vignette", "blur"] ← Second blur rejected by UI

**Predefined Presets:**

- Button "Presets" in main panel → Dropdown with 5 options:
  1. **Cinematic**: DepthOfField (focus 0.25, blur 11) + Vignette (0.7)
  2. **Vintage Film**: Sepia + Vignette (0.5) + VHS (glitch 0.03, grain 0.12)
  3. **Cyberpunk**: Glitch (high intensity) + ChromaticAberration (7px) + CRT (scanline 0.4)
  4. **Surveillance**: Thermal + EdgeDetection (sensitivity 80) + NightVision (grain 0.2)
  5. **Dream Sequence**: Blur (9) + Vignette (0.8) + ChromaticAberration (4px)
- Selecting preset: Replaces current filter stack, loads preset parameters
- Preset parameters stored as constants in code

**3. Visual Animations**

**Kaleidoscope Auto-Rotation:**

- Checkbox "Auto-Rotate" in Kaleidoscope settings (main panel when active)
- Rotation speed slider: 0.1-5.0 degrees/frame (default 0.5)
- Implementation: Increment rotation angle in KaleidoscopeFilter.apply() when enabled
- Persistence: LocalStorage saves enabled state + speed

**Glitch Temporal Variation:**

- Always active when GlitchFilter enabled (no toggle)
- Implementation: Randomize frequency parameters every 60-120 frames (1-2 seconds)
- Variation range: ±30% of slider values
- Smooth transitions: Lerp between old/new values over 30 frames

**Smooth Filter Transitions:**

- Crossfade duration: 300ms
- Implementation: Render both old/new filters during transition, blend with opacity ramp
- Triggered on: Filter change, preset selection, filter add/remove in stack
- Optional: Checkbox "Enable Smooth Transitions" in advanced settings (default ON)

**4. WebGL Acceleration**

**Global Toggle:**

- Checkbox "Use GPU Acceleration (WebGL)" in main settings panel
- Default: OFF (Canvas2D) for compatibility
- Implementation: Duplicate filter implementations (Canvas2D + WebGL versions)
- **Startup Fallback**: Auto-disable checkbox if WebGL context creation fails at startup
- **Runtime Fallback** (F5 fix): If WebGL error during filter application:
  1. Log error with filter name + error message
  2. Auto-disable "Use GPU Acceleration" checkbox (visual feedback)
  3. Display toast notification: "GPU acceleration disabled due to error. Switched to CPU rendering."
  4. Switch filter instance to Canvas2D version immediately
  5. Continue rendering without interruption
- Error scenarios covered: Context loss, shader compilation failure, out-of-memory, unsupported extensions

**Filters to Port (Priority):**

- BlurFilter (separable Gaussian shader)
- DepthOfFieldFilter (progressive blur shader)
- OilPaintingFilter (bilateral filter shader)
- All others remain Canvas2D initially (Phase 1 WebGL only)

**5. Browser Compatibility Detection**

**Startup Check:**

- Detect required APIs: MediaStream, Canvas2D, Blob, requestAnimationFrame
- Check versions: Chrome 53+, Firefox 36+, Safari 11+, Edge 79+
- Display warning modal if incompatible (non-blocking, dismissible)
- Warning message: "Your browser may not support all features. For best experience, use Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+."

**README Documentation:**

- Browser support table with tested versions
- Known issues section (e.g., "Safari 11-13: reduced performance on OilPainting filter")
- Recommended browsers section

**6. LocalStorage Persistence**

**Persisted Settings:**

- All 39 filter parameters (per-filter object)
- Active filter stack (array of FilterType)
- Current preset (string | null)
- WebGL toggle state (boolean)
- Smooth transitions enabled (boolean)
- Kaleidoscope auto-rotate state + speed

**Storage Key:** `cameraExperimentSettings_v6`
**Load on startup:** Restore settings, apply to UI + filters
**Save triggers:** On every slider change (debounced 500ms), filter stack change, toggle change

**Out of Scope:**

- **Export formats** (JPG, WEBP) - already out of scope V2
- **Video recording** (MediaRecorder) - already out of scope V2
- **Advanced animations** (timeline editor, keyframes, easing curves)
- **Custom user presets** (save/load/share user-defined presets) - defer to V7
- **Drag & drop reordering** of filter stack - sequential add only for V6
- **Per-filter WebGL toggle** - global toggle only (Approach A)
- **Sepia intensity slider** - requires matrix refactoring (Phase 3, defer to V7)
- **Thermal palette dropdown** - requires palette system refactoring (Phase 3, defer to V7)
- **Preset editor** (modify preset parameters in UI) - presets are read-only constants
- **Filter performance profiling** UI (show ms/frame per filter) - defer to V7
- **Mobile-optimized touch controls** for sliders - desktop focus for V6

## Context for Development

### Codebase Patterns

**Application Type:** Single-page real-time video processing web app

**Current Architecture (V1-V5):**

- **Pattern Strategy for filters**: All filters implement `Filter` interface with `apply(imageData): ImageData`
- **RenderPipeline**: Owns canvas, requestAnimationFrame loop, error recovery (max 10 consecutive errors)
- **SettingsOverlay**: Auto-hide UI with 200ms debounce, callback-based events
- **I18n singleton**: French/English translations, reactive language switching
- **Logger utility**: Development-only console output, no `console.*` direct calls
- **TypeScript strict mode**: Zero `any`, null safety, unused checks enabled
- **Buffer reuse pattern**: Filters reuse Uint8ClampedArray buffers (zero allocations in render loop)
- **Cleanup pattern**: All filters with buffers implement `cleanup()` method

**Critical Architecture Details (from Investigation):**

**1. Filter Lifecycle - One-Time Instantiation:**

- All 21 filters instantiated ONCE in `App.constructor()` and stored in `Map<FilterType, Filter>`
- Instances are REUSED across filter switches (never recreated)
- **Implication for V6**: Cannot recreate filters with new parameters → MUST add `setParameters()` mutation method
- Pattern from [src/main.ts](src/main.ts#L57-L79):

```typescript
this.filters = new Map([
  ["blur", new BlurFilter()],  // Created once, reused forever
  // ... 20 more filters
]);
```

**2. Four Filter Parameterization Patterns Identified:**

**Pattern A - Stateless (1 param, no buffers):**

- Example: VignetteFilter (`VIGNETTE_STRENGTH = 0.6`)
- No cleanup needed, direct in-place mutation
- Migration: Change `private readonly` → `private`, add setter

**Pattern B - Single Buffer (1-2 params, 1 reused buffer):**

- Example: BlurFilter (`KERNEL_SIZE = 5`, `tempBuffer: Uint8ClampedArray`)
- Buffer reallocated only on dimension change: `if (buffer?.length !== expectedLength) { buffer = new Uint8ClampedArray(...) }`
- Migration: Mutable params, buffer invalidation logic stays intact

**Pattern C - Multi-Buffer (2+ params, multiple buffers + invalidation):**

- Example: DepthOfFieldFilter (`FOCUS_RADIUS_RATIO = 0.3`, `MAX_BLUR_KERNEL = 9`, 3 buffers: `blurBuffer`, `distanceMap`, dimension tracking)
- **BUG FOUND**: `cleanup()` method missing → memory leak potential
- Migration: Add cleanup(), invalidate `distanceMap` when `focusRadius` changes (triggers recomputation)
- **F18 FIX - Buffer Allocation Strategy**:
  - Reallocate buffers ONLY when dimensions change: `if (!buffer || buffer.length !== width * height * 4)`
  - Parameter changes do NOT trigger buffer reallocation (reuse existing buffers)
  - Maximum memory per filter: 4 × width × height × 4 bytes (4 ImageData buffers max)
  - Example: 1920×1080 = 33MB max per heavy filter, 165MB for 5-filter stack
  - Document in filter comments: `// Buffer allocated once per resolution, reused across frames`

**Pattern D - Temporal State (6+ params, persistent state across frames):**

- Example: GlitchFilter (6 params + TTL counters for glitch persistence)
- State: `activeGlitches[]`, `frameCounter`, temporal artifact buffers
- Migration: Reset temporal state when parameters change significantly (±50%)

**3. SettingsOverlay UI Pattern - Event-Driven Callbacks:**

- HTML template strings in `createOverlay()` method (line ~50-145)
- Controls added via innerHTML, selected via `querySelector("#control-id")`
- Event pattern: `element.addEventListener("change", (e) => this.callbacks.onSomethingChanged(value))`
- **V6 Addition Pattern**:
  1. Add `onFilterParameterChanged?: (filterType, paramName, value) => void` to `SettingsCallbacks` interface
  2. Add `<div id="filter-params-container">` to HTML template
  3. Implement `updateFilterParameters(filterType)` method to dynamically generate sliders
  4. Hook into `filter-select` change listener to show/hide contextual sliders

**4. Cleanup Bug Inventory (MUST FIX in V6):**

- DepthOfFieldFilter: Missing `cleanup()` despite 3 buffers (blurBuffer, distanceMap, tracking vars)
- PixelateFilter: Missing `cleanup()` despite `scaledData` buffer
- **Action**: Add cleanup methods in Task 2.3

**5. LocalStorage - Clean Slate:**

- **Status**: ZERO localStorage usage in V1-V5 (verified via codebase grep)
- **Opportunity**: No migration logic needed, fresh V6 schema
- **Proposed Key**: `cameraExperimentSettings_v6` (versioned for future migrations)
- **Debouncing**: Save on parameter change with 500ms debounce (avoid excessive writes during slider drag)

**V6 New Patterns to Implement:**

**1. Filter Parameter Mutation (Backwards Compatible):**

```typescript
// Extended Filter interface - optional methods preserve backwards compatibility
interface Filter {
  apply(imageData: ImageData): ImageData
  cleanup?(): void
  setParameters?(params: FilterParams): void // NEW - mutate existing instance
  getDefaultParameters?(): FilterParams // NEW - for reset functionality
}

// Example implementation: BlurFilter
class BlurFilter implements Filter {
  private kernelSize: number = 5 // Changed from readonly
  private tempBuffer: Uint8ClampedArray | null = null
  
  setParameters(params: { kernelSize?: number }): void {
    if (params.kernelSize !== undefined) {
      // Validate and clamp to valid range
      this.kernelSize = Math.max(3, Math.min(15, params.kernelSize))
      // Note: tempBuffer NOT invalidated (size-independent)
    }
  }
  
  getDefaultParameters(): { kernelSize: number } {
    return { kernelSize: 5 }
  }
  
  apply(imageData: ImageData): ImageData {
    // Use this.kernelSize instead of hardcoded constant
    // Buffer reuse logic stays intact
  }
}
```

**Key Principles:**

- Filters with no parameters (Invert, Sepia) don't implement `setParameters` → no changes needed
- Parameters validated/clamped in `setParameters` (never throw, always clamp to safe range)
- Buffer invalidation ONLY when parameter affects buffer size (e.g., DepthOfFieldFilter `focusRadius` invalidates `distanceMap`)

**2. LocalStorage Persistence with Debouncing:**

```typescript
// SettingsStorage utility (NEW file)
class SettingsStorage {
  private static readonly STORAGE_KEY = 'cameraExperimentSettings_v6'
  private static saveTimeout: number | null = null
  
  static save(settings: StoredSettings): void {
    // Debounce: prevent excessive writes during slider drag
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = window.setTimeout(() => {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          Logger.warn('localStorage quota exceeded, skipping save')
        } else {
          Logger.error('Failed to save settings', error)
        }
      }
    }, 500) // 500ms debounce
  }
  
  static load(): StoredSettings | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return null
      const parsed = JSON.parse(data)
      // Validate schema version, migrate if needed (future V7)
      return parsed.version === 6 ? parsed : null
    } catch (error) {
      Logger.error('Failed to load settings, using defaults', error)
      return null
    }
  }
}

// Usage in App
private handleParameterChange(filterType: FilterType, paramName: string, value: number): void {
  const filter = this.filters.get(filterType)
  filter?.setParameters?.({ [paramName]: value })
  
  // Save to localStorage (debounced)
  const settings = SettingsStorage.load() ?? createDefaultSettings()
  settings.filterParams[filterType] = { ...settings.filterParams[filterType], [paramName]: value }
  SettingsStorage.save(settings) // Debounced internally
}
```

**3. Filter Stack Pipeline (Sequential Application):**

```typescript
// RenderPipeline modification
class RenderPipeline {
  private filterStack: Filter[] = [] // Changed from single filter
  
  setFilterStack(filters: Filter[]): void {
    // Cleanup old filters
    this.filterStack.forEach(f => f.cleanup?.())
    this.filterStack = filters
  }
  
  private render(): void {
    // ... get source imageData from video
    
    let processedData = sourceImageData
    for (const filter of this.filterStack) {
      processedData = filter.apply(processedData)
    }
    
    // ... draw processedData to canvas
  }
}

// Max 5 filters enforced in UI
const MAX_FILTER_STACK_SIZE = 5
```

**4. Dynamic Slider Generation (SettingsOverlay):**

```typescript
// Parameter metadata (from types/index.ts)
interface FilterParameterDef {
  name: string // Internal key (e.g., "kernelSize")
  label: string // i18n key (e.g., "filterParams.blur.kernelSize")
  min: number
  max: number
  step: number
  default: number
}

// SettingsOverlay method
private renderContextualSliders(filterType: FilterType): void {
  const container = document.getElementById('filter-params-container')
  const paramDefs = FILTER_PARAMETER_DEFINITIONS[filterType]
  
  if (!paramDefs) {
    container.style.display = 'none'
    return
  }
  
  container.style.display = 'block'
  container.innerHTML = paramDefs.map(param => `
    <div class="setting-group">
      <label>${I18n.t().filterParams[filterType][param.name]}</label>
      <input type="range" 
             id="param-${param.name}" 
             min="${param.min}" 
             max="${param.max}" 
             step="${param.step}" 
             value="${param.default}"
             class="setting-control">
      <span id="param-${param.name}-value">${param.default}</span>
    </div>
  `).join('')
  
  // Wire event listeners
  paramDefs.forEach(param => {
    const slider = document.getElementById(`param-${param.name}`) as HTMLInputElement
    const valueDisplay = document.getElementById(`param-${param.name}-value`)
    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      valueDisplay.textContent = value.toString()
      this.callbacks.onParameterChanged?.(filterType, param.name, value)
    })
  })
}
```

**5. Smooth Filter Transitions (Double-Buffer Crossfade):**

```typescript
// FilterTransitionManager (NEW file)
class FilterTransitionManager {
  private oldFilter: Filter | null = null
  private newFilter: Filter | null = null
  private startTime: number = 0
  private readonly DURATION = 300 // milliseconds
  
  startTransition(oldFilter: Filter, newFilter: Filter): void {
    this.oldFilter = oldFilter
    this.newFilter = newFilter
    this.startTime = Date.now()
  }
  
  getBlendedFrame(sourceImageData: ImageData): ImageData | null {
    const elapsed = Date.now() - this.startTime
    const progress = Math.min(elapsed / this.DURATION, 1.0) // 0.0 to 1.0
    
    if (progress >= 1.0) {
      return null // Transition complete
    }
    
    // Apply both filters
    const oldData = this.oldFilter!.apply(cloneImageData(sourceImageData))
    const newData = this.newFilter!.apply(cloneImageData(sourceImageData))
    
    // Blend pixel-by-pixel
    const blended = new ImageData(oldData.width, oldData.height)
    for (let i = 0; i < oldData.data.length; i++) {
      blended.data[i] = Math.round(
        oldData.data[i]! * (1 - progress) + newData.data[i]! * progress
      )
    }
    
    return blended
  }
}
```

### Files to Reference

**Existing Files to Study:**

| File | Purpose | Relevance |
| ---- | ------- | --------- |
| [src/filters/Filter.ts](src/filters/Filter.ts) | Filter interface | Extend with setParameters/getDefaultParameters |
| [src/core/RenderPipeline.ts](src/core/RenderPipeline.ts) | Render loop | Modify for filter stack + transitions |
| [src/ui/SettingsOverlay.ts](src/ui/SettingsOverlay.ts) | Main UI panel | Add contextual sliders + Advanced button |
| [src/main.ts](src/main.ts) | App orchestration | Wire new components (FilterParameterManager, SettingsStorage) |
| [src/i18n/translations.ts](src/i18n/translations.ts) | FR/EN labels | Add slider labels, preset names, warnings |
| [src/types/index.ts](src/types/index.ts) | Type definitions | Add FilterParams, Preset, StoredSettings types |

**All 17 Filters with Parameters (to refactor):**

- [src/filters/AsciiFilter.ts](src/filters/AsciiFilter.ts)
- [src/filters/BlurFilter.ts](src/filters/BlurFilter.ts)
- [src/filters/ChromaticAberrationFilter.ts](src/filters/ChromaticAberrationFilter.ts)
- [src/filters/ComicBookFilter.ts](src/filters/ComicBookFilter.ts)
- [src/filters/CRTFilter.ts](src/filters/CRTFilter.ts)
- [src/filters/DepthOfFieldFilter.ts](src/filters/DepthOfFieldFilter.ts)
- [src/filters/EdgeDetectionFilter.ts](src/filters/EdgeDetectionFilter.ts)
- [src/filters/GlitchFilter.ts](src/filters/GlitchFilter.ts)
- [src/filters/KaleidoscopeFilter.ts](src/filters/KaleidoscopeFilter.ts)
- [src/filters/MotionDetectionFilter.ts](src/filters/MotionDetectionFilter.ts)
- [src/filters/NightVisionFilter.ts](src/filters/NightVisionFilter.ts)
- [src/filters/OilPaintingFilter.ts](src/filters/OilPaintingFilter.ts)
- [src/filters/PixelateFilter.ts](src/filters/PixelateFilter.ts)
- [src/filters/RotoscopeFilter.ts](src/filters/RotoscopeFilter.ts)
- [src/filters/SobelRainbowFilter.ts](src/filters/SobelRainbowFilter.ts)
- [src/filters/VHSFilter.ts](src/filters/VHSFilter.ts)
- [src/filters/VignetteFilter.ts](src/filters/VignetteFilter.ts)

**New Files to Create:**

| File | Purpose |
| ---- | ------- |
| `src/core/FilterParameterManager.ts` | Observer pattern for parameter updates |
| `src/core/SettingsStorage.ts` | LocalStorage persistence utility |
| `src/ui/AdvancedSettingsModal.ts` | Modal with all sliders (accordéon) |
| `src/ui/FilterStackUI.ts` | Filter pipeline visualization (chips) |
| `src/ui/PresetsUI.ts` | Preset dropdown UI component |
| `src/core/FilterTransitionManager.ts` | Crossfade transitions between filters |
| `src/utils/BrowserCompatibility.ts` | Browser detection + warning logic |
| `src/filters/webgl/BlurFilterWebGL.ts` | WebGL version of Blur (Phase 1) |
| `src/filters/webgl/DepthOfFieldFilterWebGL.ts` | WebGL version of DoF (Phase 1) |
| `src/filters/webgl/OilPaintingFilterWebGL.ts` | WebGL version of OilPainting (Phase 1) |
| `src/filters/webgl/WebGLFilterBase.ts` | Base class for WebGL filters (shader utils) |
| `src/presets/PresetDefinitions.ts` | Preset configurations (5 presets) |

### Technical Decisions

**1. Parameter System Architecture:**

**Decision:** Observer pattern with centralized `FilterParameterManager`

**Rationale:**

- Decouples UI (sliders) from filter implementations
- Enables multiple UI views (contextual panel + advanced modal) observing same state
- LocalStorage integration is clean (single source of truth)
- Backwards compatible: Filters without `setParameters` continue working with defaults

**Alternative considered:** Direct filter property mutation from UI
**Rejected because:** Tight coupling, difficult to sync multiple UI views, no change notification

**2. Filter Stack Implementation:**

**Decision:** Sequential array application in `RenderPipeline.applyFilterStack()`

**Rationale:**

- Simple, predictable behavior (order matters)
- Easy to debug (can inspect intermediate ImageData between filters)
- Performance acceptable for max 5 filters (tested in V5: 4 filters @ 30+ FPS)

**Alternative considered:** Composite pattern with nested filters
**Rejected because:** Over-engineering for V6 scope, harder to visualize in UI

**3. Transition Implementation:**

**Decision:** Double-buffer crossfade (render both filters, blend with opacity)

**Rationale:**

- Smooth visual effect (300ms is noticeable but not sluggish)
- Reuses existing requestAnimationFrame loop (no separate animation timer)
- Minimal memory overhead (1 extra ImageData during transition only)

**Implementation details:**

```typescript
// Pseudo-code
if (isTransitioning) {
  const oldImageData = oldFilter.apply(sourceImageData)
  const newImageData = newFilter.apply(sourceImageData)
  const progress = (Date.now() - transitionStart) / 300 // 0.0 to 1.0
  const blended = blendImageData(oldImageData, newImageData, progress)
  if (progress >= 1.0) isTransitioning = false
  return blended
}
```

**4. WebGL Toggle Approach:**

**Decision:** Global toggle (Approach A) with automatic fallback

**Rationale:**

- Simpler UX (one checkbox, not 39 per-filter toggles)
- Matches user mental model: "Use GPU or CPU for everything"
- Reduces testing surface (2 code paths vs 2^17 combinations)
- Fallback safety: If WebGL fails, entire app continues on Canvas2D

**Implementation:**

- `RenderPipeline` checks `webglEnabled` flag
- Instantiates `BlurFilterWebGL` vs `BlurFilter` based on flag
- WebGL context creation wrapped in try-catch → auto-disable on failure

**5. LocalStorage Schema:**

**Decision:** Single JSON object with version key (`cameraExperimentSettings_v6`)

**Rationale:**

- Version key enables future migration (V7 can detect V6 settings and upgrade)
- Single object = atomic read/write (no race conditions)
- Debounced saves (500ms) prevent excessive writes on slider drag

**Migration strategy (future):**

```typescript
const stored = localStorage.getItem('cameraExperimentSettings_v6')
if (!stored) {
  // Check for V5 settings, migrate if needed
  const v5Settings = localStorage.getItem('cameraExperimentSettings_v5')
  if (v5Settings) migrateFromV5(v5Settings)
}
```

**6. Preset Parameter Storage:**

**Decision:** Hardcoded TypeScript constants in `PresetDefinitions.ts`

**Rationale:**

- No UI needed for V6 (defer preset editor to V7)
- Type-safe at compile time (catches missing parameters)
- Easy to iterate during development (tweak values, test, commit)

**Example:**

```typescript
export const PRESETS: Record<string, PresetConfig> = {
  cinematic: {
    name: 'Cinematic',
    filters: [
      { type: 'dof', params: { focusRadius: 0.25, blurStrength: 11 } },
      { type: 'vignette', params: { strength: 0.7 } }
    ]
  },
  // ...
}
```

## Implementation Plan

### Tasks

**PHASE 1: Foundation & Type System (2-3 days)**

- [ ] **Task 1.1**: Define FilterParameters type system
  - File: `src/types/index.ts`
  - Action: Add `FilterParameters` discriminated union for all 17 parameterizable filters
  - Action: Each filter's params as a distinct type with `type` discriminator (e.g., `{ type: 'blur', kernelSize: number }`)
  - Action: Add `FilterParametersMap` mapping FilterType to its params type
  - Action: Add `PresetConfig` interface with `name`, `filters[]` structure
  - Action: Add `StoredSettings` interface for localStorage schema
  - Action: **F13 FIX** - Add `FilterParameterDefinitions` with min/max/step/default for each param:

    ```typescript
    export const FILTER_PARAM_DEFS = {
      blur: { kernelSize: { min: 1, max: 15, step: 1, default: 5 } },
      vignette: { strength: { min: 0, max: 1, step: 0.05, default: 0.6 } },
      glitch: { 
        intensity: { min: 0, max: 1, step: 0.1, default: 0.5 },
        minDuration: { min: 5, max: 120, step: 5, default: 30 }
      }
      // ... all 39 params with appropriate step sizes
    } as const
    ```

  - Action: **F13 FIX** - Use step=0.05 for normalized params (0-1), step=1 for integers, step=0.1 for decimals
  - Notes: **F2 FIX** - Use discriminated union to preserve type safety, avoid `any`

- [ ] **Task 1.2**: Extend Filter interface with parameter methods
  - File: `src/filters/Filter.ts`
  - Action: Add optional `setParameters(params: Partial<FilterParametersMap[T]>): void` method to Filter interface (type-safe, not `any`)
  - Action: Add optional `getDefaultParameters(): FilterParametersMap[T]` method to Filter interface
  - Notes: **F2 FIX** - Methods remain optional for backwards compatibility with non-parameterizable filters (Invert, Sepia, etc.)
  - Notes: Use `Partial<>` to allow incremental updates (update kernelSize without specifying all params)
  - Example implementation:

    ```typescript
    export interface Filter {
      apply(imageData: ImageData): ImageData
      cleanup?(): void
      setParameters?<T extends FilterType>(params: Partial<FilterParametersMap[T]>): void
      getDefaultParameters?<T extends FilterType>(): FilterParametersMap[T]
    }
    ```

- [ ] **Task 1.3**: Create SettingsStorage utility
  - File: `src/core/SettingsStorage.ts` (NEW)
  - Action: Implement `save(settings: StoredSettings): void` with debounced writes (500ms)
  - Action: Implement `load(): StoredSettings | null` with JSON parsing + error handling
  - Action: Implement `clear(): void` to reset localStorage
  - Action: **F3 FIX** - Add `flush(): void` method for synchronous save (no debounce)
  - Action: **F3 FIX** - Register `window.addEventListener('beforeunload', () => SettingsStorage.flush())` to prevent data loss on tab close
  - Action: **F15 FIX** - Include animation states in StoredSettings schema:

    ```typescript
    interface StoredSettings {
      filterParams: Record<FilterType, FilterParameters>
      filterStack: FilterType[]
      webglEnabled: boolean
      smoothTransitionsEnabled: boolean
      kaleidoscopeAutoRotate: { enabled: boolean, speed: number } // F15 fix
      // No glitchVariation state (randomized per session)
    }
    ```

  - Notes: Use storage key `cameraExperimentSettings_v6`, handle quota exceeded errors gracefully
  - Notes: Debounce prevents excessive writes during slider drag; flush ensures final state is saved before unload

- [ ] **Task 1.4**: Create BrowserCompatibility utility
  - File: `src/utils/BrowserCompatibility.ts` (NEW)
  - Action: Implement `checkCompatibility(): { compatible: boolean, missing: string[] }` checking MediaStream, Canvas2D, Blob, requestAnimationFrame APIs
  - Action: Implement `getBrowserInfo(): { name: string, version: string }` for logging
  - Notes: Use feature detection, not user agent sniffing

**PHASE 2: Filter Parameterization (4-5 days)**

- [ ] **Task 2.1**: Refactor simple filters (Phase 1: 11 filters, 17 params)
  - Files: `src/filters/AsciiFilter.ts`, `BlurFilter.ts`, `ChromaticAberrationFilter.ts`, `ComicBookFilter.ts`, `EdgeDetectionFilter.ts`, `KaleidoscopeFilter.ts`, `SobelRainbowFilter.ts`, `VignetteFilter.ts`, `DepthOfFieldFilter.ts`, `NightVisionFilter.ts`, `PixelateFilter.ts`
  - Action: Convert `private readonly CONST` to `private param: number` with default value
  - Action: Implement `setParameters({ param: value })` to update private fields (type-safe using FilterParametersMap[T])
  - Action: Implement `getDefaultParameters()` returning default values object
  - Action: **F7 FIX** - Add validation in setParameters: clamp values to min/max ranges, reject NaN/Infinity
  - Notes: Ensure buffer reuse logic stays intact (check buffer size, reallocate only on dimension change)

- [ ] **Task 2.2**: Refactor complex filters (Phase 2: 6 filters, 22 params)
  - Files: `src/filters/CRTFilter.ts`, `MotionDetectionFilter.ts`, `OilPaintingFilter.ts`, `RotoscopeFilter.ts`, `VHSFilter.ts`, `GlitchFilter.ts`
  - Action: Convert multiple constants to private mutable fields
  - Action: Implement `setParameters()` with validation (clamp values to min/max ranges)
  - Action: For GlitchFilter temporal state: Reset TTL counters when parameters change significantly
  - Action: **F7 + F14 FIX** - Validate param relationships with specific logic:
    - GlitchFilter: if `minDuration > maxDuration`, swap values automatically
    - GlitchFilter: ensure `maxDuration - minDuration >= 10` (minimum variation range)
    - DepthOfField: ensure `focusRadius <= 1.0` (normalized coordinate)
    - Log warnings when auto-corrections applied: `Logger.warn('Auto-corrected minDuration > maxDuration')`
  - Notes: Test edge cases (e.g., GlitchFilter with minDuration > maxDuration should swap/clamp)

- [ ] **Task 2.3**: Add cleanup() to filters missing it
  - Files: `src/filters/DepthOfFieldFilter.ts`, `PixelateFilter.ts`
  - Action: Implement `cleanup()` method setting buffers to null
  - Action: **F6 FIX** - Register filters in RenderPipeline cleanup tracker (automatic cleanup on stack removal)
  - Notes: Identified during investigation - these filters allocate buffers but lack cleanup

**PHASE 3: UI - Contextual Sliders (3-4 days)**

- [ ] **Task 3.1**: Add slider generation logic to SettingsOverlay
  - File: `src/ui/SettingsOverlay.ts`
  - Action: Add `renderContextualSliders(filterType: FilterType)` method generating HTML sliders dynamically based on filter type
  - Action: Add slider container div in settings panel HTML template (after filter dropdown)
  - Action: Implement slider event listeners calling new callback `onParameterChanged(filterType, paramName, value)`
  - Action: **F7 FIX** - Add validation on input events: clamp to min/max, reject NaN
  - Notes: Use HTML5 range inputs, display current value next to slider, include min/max/step attributes from parameter definitions

- [ ] **Task 3.2**: Add "Advanced Settings" button + modal stub
  - File: `src/ui/SettingsOverlay.ts`
  - Action: Add "Advanced" button in settings panel below contextual sliders
  - Action: Add placeholder modal HTML structure (accordion sections for each filter)
  - Action: **F8 FIX** - Initialize Toast notification system in app startup (main.ts)
  - Notes: Modal implementation in Task 3.5
  - Action: Wire button click to show/hide modal (add `.hidden` class toggle)
  - Notes: Modal content will be populated in Task 3.3

- [ ] **Task 3.3**: Implement AdvancedSettingsModal component
  - File: `src/ui/AdvancedSettingsModal.ts` (NEW)
  - Action: Generate accordion UI with all 17 filters as collapsible sections
  - Action: Render all 39 sliders organized by filter, disabled when filter inactive
  - Action: Add "Reset" button per section + "Reset All" button at top
  - Action: **F16 FIX** - Add "Expand All" / "Collapse All" buttons in modal header for better UX
  - Action: **F16 FIX** - Auto-expand sections for filters currently in the active stack (highlight active filters)
  - Action: **F16 FIX** - Add visual indicator (badge) showing "Active" on filters in current stack
  - Action: Wire slider changes to same callback as contextual sliders
  - Notes: Use details/summary HTML elements for accordion, sync state with main panel sliders

- [ ] **Task 3.4**: Add i18n labels for sliders
  - File: `src/i18n/translations.ts`
  - Action: **F11 FIX** - Add `filterParams` section with French/English labels for all 39 parameters (comprehensive coverage)
  - Action: Add button labels: `advancedSettings`, `resetFilter`, `resetAll`, `addFilter`, `removeFilter`
  - Action: **F11 FIX** - Add units in labels where applicable (e.g., "Rotation Speed (°/frame)", "Kernel Size (px)")
  - Action: **F11 FIX** - Verify each parameter has both fr/en translations (no missing keys)
  - Notes: Follow existing pattern (nested objects), use descriptive labels (e.g., "Blur Strength" not "kernelSize")
  - Example:

    ```typescript
    filterParams: {
      blur: { kernelSize: { fr: 'Intensité du flou (px)', en: 'Blur Strength (px)' } },
      glitch: { 
        intensity: { fr: 'Intensité', en: 'Intensity' },
        minDuration: { fr: 'Durée min (frames)', en: 'Min Duration (frames)' }
      }
    }
    ```

**PHASE 4: Filter Stack & Presets (2-3 days)**

- [ ] **Task 4.1**: Modify RenderPipeline for filter stack
  - File: `src/core/RenderPipeline.ts`
  - Action: Change `private currentFilter: Filter` to `private filterStack: Filter[]`
  - Action: Implement `setFilterStack(filters: Filter[])` replacing setFilter()
  - Action: **F22 FIX** - Wrap filter stack application in try-catch error boundary:

    ```typescript
    for (const filter of filterStack) {
      try {
        imageData = filter.apply(imageData)
      } catch (error) {
        Logger.error('Filter crashed in stack', error, filter.constructor.name)
        this.removeFilterFromStack(filter) // Auto-remove crashed filter
        this.showToast(`Filter ${filter.constructor.name} disabled due to error`)
        continue // Skip crashed filter, continue with rest of stack
      }
    }
    ```

  - Action: Add `removeFilterFromStack(filter: Filter)` method
  - Notes: Keep backwards compatibility by treating single filter as stack of 1
  - Notes: Error recovery extends existing RenderPipeline.consecutiveErrors tracking (max 10)

- [ ] **Task 4.2**: Implement cleanup tracking for filter stack
  - File: `src/core/RenderPipeline.ts`
  - Action: **F6 FIX** - Track filters requiring cleanup in `private cleanupRegistry: Set<Filter>`
  - Action: **F6 FIX** - Call `filter.cleanup()` automatically when filter removed from stack via `setFilterStack()`
  - Action: **F6 FIX** - Call cleanup on all filters in `stop()` method before clearing stack
  - Action: Add `cleanupStack(): void` helper method:

    ```typescript
    private cleanupStack(): void {
      for (const filter of this.filterStack) {
        if (filter.cleanup && this.cleanupRegistry.has(filter)) {
          filter.cleanup()
          Logger.debug('Cleaned up filter', filter.constructor.name)
        }
      }
      this.cleanupRegistry.clear()
      this.filterStack = []
    }
    ```

  - Notes: Prevents memory leaks from accumulated ImageData buffers in DepthOfField, Pixelate, MotionDetection, Kaleidoscope
  - Notes: Replaces current approach where cleanup() is never called automatically (V1-V5 bug)

- [ ] **Task 4.3**: Create PresetDefinitions constants
  - File: `src/presets/PresetDefinitions.ts` (NEW)
  - Action: Define `PRESETS` object with 5 preset configurations (Cinematic, Vintage Film, Cyberpunk, Surveillance, Dream Sequence)
  - Action: Each preset: array of `{ type: FilterType, params: FilterParameters }`
  - Action: **F12 FIX** - Add `validatePreset(preset): boolean` function checking:
    - No duplicate FilterTypes in stack
    - Stack length <= 5
    - All params within valid ranges (use filter getDefaultParameters() for bounds)
    - All FilterTypes exist in available filters Map
  - Action: **F12 FIX** - Call validation in unit tests for all 5 presets (prevent regression)
  - Action: **F8 FIX** - Add `Toast.info('Preset loaded: ${presetName}')` when preset applied successfully
  - Notes: Use exact parameter values specified in scope section

- [ ] **Task 4.4**: Add filter stack UI visualization
  - File: `src/ui/FilterStackUI.ts` (NEW)
  - Action: Render filter chips/pills showing active filters in order
  - Action: Add "X" button on each chip calling `onFilterRemoved(index)` callback
  - Action: Add "Add Filter" dropdown (appears when stack.length < 5 && stack[0] !== 'none')
  - Action: **F8 FIX** - Display Toast.warning when attempting to add 6th filter ("Max 5 filters allowed")
  - Notes: Inject into SettingsOverlay container, update on every stack change

- [ ] **Task 4.4**: Add preset dropdown UI
  - File: `src/ui/SettingsOverlay.ts`
  - Action: Add "Presets" dropdown in settings panel (below source selector, above filter dropdown)
  - Action: Populate with preset names from PresetDefinitions
  - Action: Wire selection to new callback `onPresetSelected(presetName: string)`
  - Notes: Selecting preset replaces entire filter stack + loads preset parameters

- [ ] **Task 4.5**: Wire filter stack to main App
  - File: `src/main.ts`
  - Action: Add `currentFilterStack: FilterType[]` state tracking
  - Action: Implement `onFilterStackChanged(stack: FilterType[])` rebuilding Filter[] array from Map
  - Action: Implement `onPresetSelected(preset)` loading preset from PresetDefinitions, updating stack + parameters
  - Notes: Call `renderPipeline.setFilterStack()` on every stack change

**PHASE 5: Animations & Transitions (2-3 days)**

- [ ] **Task 5.1**: Add rotation state to KaleidoscopeFilter
  - File: `src/filters/KaleidoscopeFilter.ts`
  - Action: Add `private rotationAngle: number = 0` field
  - Action: Add `private autoRotateEnabled: boolean = false` field
  - Action: Add `private rotationSpeed: number = 0.5` field
  - Action: In `apply()`, increment `rotationAngle += rotationSpeed` when autoRotateEnabled
  - Action: Add `setAutoRotate(enabled: boolean, speed: number)` method
  - Notes: Rotation applies during polar coordinate transformation

- [ ] **Task 5.2**: Add temporal variation to GlitchFilter
  - File: `src/filters/GlitchFilter.ts`
  - Action: Add `private frameCounter: number = 0` field
  - Action: Add `private nextVariationFrame: number` field (randomized 60-120)
  - Action: In `apply()`, check `frameCounter >= nextVariationFrame` → randomize frequencies ±30%
  - Action: Implement smooth lerp transitions over 30 frames for frequency changes
  - Notes: Store original slider values separately, variation modifies working copy

- [ ] **Task 5.3**: Implement FilterTransitionManager
  - File: `src/core/FilterTransitionManager.ts` (NEW)
  - Action: Implement `startTransition(oldFilter, newFilter, duration)` storing transition state
  - Action: Implement `getBlendedFrame(sourceImageData): ImageData` applying both filters + blending
  - Action: Track progress via `(Date.now() - startTime) / duration`, return null when complete
  - Notes: Used by RenderPipeline when filter changes, 300ms default duration

- [ ] **Task 5.4**: Wire transitions to RenderPipeline
  - File: `src/core/RenderPipeline.ts`
  - Action: Add `private transitionManager: FilterTransitionManager | null` field
  - Action: In `setFilterStack()`, create transition from old stack to new stack
  - Action: In render loop, check if transition active → use `transitionManager.getBlendedFrame()` instead of normal apply
  - Notes: Transition only on user-triggered changes, not programmatic updates

- [ ] **Task 5.5**: Add animation controls UI
  - File: `src/ui/SettingsOverlay.ts`
  - Action: Add "Auto-Rotate" checkbox in Kaleidoscope contextual sliders (visible only when filter active)
  - Action: Add rotation speed slider (0.1-5.0) below checkbox
  - Action: Add "Smooth Transitions" checkbox in advanced settings modal (global, affects all filter changes)
  - Notes: Wire to new callbacks `onAutoRotateChanged(enabled, speed)`, `onSmoothTransitionsToggled(enabled)`

**PHASE 6: WebGL Acceleration (4-5 days)**

- [ ] **Task 6.1**: Create WebGLFilterBase utility
  - File: `src/filters/webgl/WebGLFilterBase.ts` (NEW)
  - Action: Implement shader compilation helpers: `compileShader(source, type)`, `linkProgram(vs, fs)`
  - Action: Implement texture creation: `createTexture(imageData)`, `readPixels(): ImageData`
  - Action: Implement error handling for context loss, shader compile failures
  - Action: **F17 FIX** - Add comprehensive WebGL feature detection:

    ```typescript
    static checkWebGLSupport(): { supported: boolean, version: '1'|'2'|null, extensions: string[] } {
      const canvas = document.createElement('canvas')
      const gl2 = canvas.getContext('webgl2')
      if (gl2) return { supported: true, version: '2', extensions: gl2.getSupportedExtensions() }
      const gl1 = canvas.getContext('webgl')
      if (gl1) return { supported: true, version: '1', extensions: gl1.getSupportedExtensions() }
      return { supported: false, version: null, extensions: [] }
    }
    ```

  - Action: **F17 FIX** - Check for required extensions: `OES_texture_float` (for Blur separable passes)
  - Notes: Abstract common WebGL boilerplate, used by all WebGL filter implementations

- [ ] **Task 6.2**: Implement BlurFilterWebGL
  - File: `src/filters/webgl/BlurFilterWebGL.ts` (NEW)
  - Action: Write vertex shader (fullscreen quad)
  - Action: Write fragment shader (separable Gaussian blur: horizontal pass)
  - Action: Write second fragment shader (vertical pass)
  - Action: Implement `apply()` using two-pass rendering (horizontal → vertical)
  - Notes: Match BlurFilter parameter interface (`kernelSize`), implement fallback to Canvas2D on error

- [ ] **Task 6.3**: Implement DepthOfFieldFilterWebGL
  - File: `src/filters/webgl/DepthOfFieldFilterWebGL.ts` (NEW)
  - Action: Write fragment shader with variable blur kernel based on distance from center
  - Action: Precompute distance map texture (CPU-side, uploaded once per resolution change)
  - Action: Implement progressive blur (kernel size = distance * maxBlur)
  - Notes: High complexity shader, ensure graceful fallback

- [ ] **Task 6.4**: Implement OilPaintingFilterWebGL
  - File: `src/filters/webgl/OilPaintingFilterWebGL.ts` (NEW)
  - Action: Write fragment shader approximating bilateral filter (edge-preserving blur)
  - Action: Implement color quantization in shader (reduce to N levels)
  - Action: Optimize for real-time performance (may need to simplify algorithm vs Canvas2D version)
  - Notes: Most complex shader in V6, fallback is critical

- [ ] **Task 6.5**: Add WebGL toggle UI + wiring
  - File: `src/ui/SettingsOverlay.ts`
  - Action: Add "Use GPU Acceleration (WebGL)" checkbox in main settings panel
  - Action: Wire to callback `onWebGLToggled(enabled: boolean)`
  - File: `src/main.ts`
  - Action: Implement WebGL context creation with fallback detection
  - Action: Instantiate WebGL vs Canvas2D filter versions based on toggle + availability
  - Action: **F5 FIX** - Add runtime WebGL error handler:

    ```typescript
    canvas.addEventListener('webglcontextlost', (e) => {
      Logger.error('WebGL context lost, falling back to Canvas2D')
      Toast.warning('GPU acceleration disabled due to error')
      this.webglEnabled = false // Auto-disable checkbox
      this.rebuildFilterStack() // Switch to Canvas2D versions
    })
    ```

  - Action: **F8 FIX** - Display Toast.warning if WebGL unavailable on startup ("WebGL not supported, using Canvas2D")
  - Notes: Default OFF for compatibility, store preference in localStorage
  - Notes: Context loss can occur mid-session (GPU crash, driver issues), fallback must be automatic

**PHASE 7: Integration & Polish (2-3 days)**

- [ ] **Task 7.1**: Wire LocalStorage persistence
  - File: `src/main.ts`
  - Action: On app startup, call `SettingsStorage.load()` and restore: filter params, stack, preset, WebGL toggle, transitions toggle
  - Action: On every settings change, debounced save to `SettingsStorage.save()`
  - Action: **F3 FIX** - Register beforeunload handler: `window.addEventListener('beforeunload', () => SettingsStorage.flush())`
  - Action: Handle localStorage quota exceeded gracefully (log warning, continue without persistence)
  - Action: **F8 FIX** - Display Toast.error on quota exceeded ("Settings could not be saved")
  - Notes: Use 500ms debounce to avoid excessive writes during slider drag
  - Notes: flush() bypasses debounce for immediate synchronous save before tab close

- [ ] **Task 7.2**: Add browser compatibility check at startup
  - File: `src/main.ts`
  - Action: Call `BrowserCompatibility.checkCompatibility()` on app init
  - Action: If incompatible, display modal warning (non-blocking, dismissible) with recommended browsers
  - Action: **F8 FIX** - Use Toast.warning for compatibility warnings instead of modal (less intrusive)
  - Action: **F9 FIX** - Add explicit Safari detection and warning about OilPainting/DepthOfField performance degradation
  - Action: Log browser info to Logger for debugging
  - Notes: Check MediaStream, Canvas2D, Blob, requestAnimationFrame APIs

- [ ] **Task 7.3**: Update README with browser compatibility
  - File: `README.md`
  - Action: Add "Browser Compatibility" section with tested versions table
  - Action: Add "Known Issues" section (e.g., Safari performance on OilPainting)
  - Action: Add "Recommended Browsers" list (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
  - Action: **F20 FIX** - Add detailed "WebGL Acceleration" section:
    - Requirements: WebGL 2.0 or WebGL 1.0 + OES_texture_float extension
    - Supported filters: Blur, DepthOfField, OilPainting
    - Automatic fallback: Canvas2D versions used if WebGL unavailable or crashes
    - Performance comparison table: Canvas2D vs WebGL FPS at 720p/1080p
    - How to enable: Settings → "Use GPU Acceleration" checkbox
    - Default: OFF (compatibility-first approach)
  - Action: **F20 FIX** - Document filter stack performance expectations (15+ FPS @ 720p for 5 heavy filters)
  - Notes: Include screenshots of WebGL toggle UI

- [ ] **Task 7.4**: Update package.json version
  - File: `package.json`
  - Action: Bump version from current to `1.6.0`
  - Notes: Semantic versioning: V6 = minor version bump

- [ ] **Task 7.5**: Comprehensive manual testing
  - Action: Test all 39 sliders on all 17 filters (verify visual changes, no crashes)
  - Action: **F10 FIX** - Test filter stacking performance at realistic resolutions: 15+ FPS @ 720p for 5 heavy filters (Blur, DoF, OilPainting)
  - Action: Test all 5 presets - verify correct filters + parameters loaded
  - Action: Test animations (Kaleidoscope rotation, Glitch variation, smooth transitions)
  - Action: Test WebGL toggle + fallback (disable WebGL in browser, verify Canvas2D fallback)
  - Action: **F22 FIX** - Test error recovery: Inject errors in filter apply() methods, verify auto-removal + toast notification
  - Action: Test localStorage persistence (change settings, reload page, verify restored)
  - Action: **F3 FIX** - Test beforeunload handler: Change settings, close tab immediately, reopen, verify settings saved
  - Action: Test browser warning (use old browser or mock API unavailability)
  - Notes: Create testing checklist document, record any bugs found

**PHASE 8: Testing & Documentation (2-3 days)**

- [ ] **Task 8.1**: Write unit tests for SettingsStorage
  - File: `src/core/__tests__/SettingsStorage.test.ts` (NEW)
  - Action: Test save/load round-trip with mock localStorage
  - Action: Test JSON parsing errors (corrupted data) → should return null
  - Action: Test quota exceeded error → should log warning, not crash
  - Notes: Mock `window.localStorage` using Vitest vi.mock()

- [ ] **Task 8.2**: Write unit tests for filter setParameters
  - Files: `src/filters/__tests__/BlurFilter.test.ts`, `GlitchFilter.test.ts`, `VignetteFilter.test.ts` (modify existing)
  - Action: Add test: call `setParameters()` → verify private fields updated
  - Action: Add test: apply filter with custom params → verify visual output differs from defaults
  - Action: Add test: `getDefaultParameters()` → verify returns correct default values
  - Action: **F19 FIX** - Add specific coverage targets per component:
    - Filter setParameters: 100% coverage (critical mutation path)
    - SettingsStorage: 95%+ coverage (persistence layer)
    - BrowserCompatibility: 90%+ coverage (detection logic)
    - UI components: 70%+ coverage (DOM manipulation, lower priority)
    - Overall project: maintain 80%+ coverage (existing standard)
  - Action: **F19 FIX** - Add test for param validation edge cases: NaN, Infinity, out-of-range, null/undefined
  - Notes: Expand existing test files, run `npm run test:coverage` to verify targets met

- [ ] **Task 8.3**: Write integration tests for filter stack
  - File: `src/core/__tests__/RenderPipeline.test.ts` (modify existing)
  - Action: Test applying 3-filter stack → verify sequential application (output1 → filter2 → output2 → filter3 → final)
  - Action: Test stack with params → verify each filter uses correct parameters
  - Action: Test empty stack → should behave like "none" filter
  - Notes: Use simple mock filters for predictable output verification

- [ ] **Task 8.4**: Write tests for BrowserCompatibility
  - File: `src/utils/__tests__/BrowserCompatibility.test.ts` (NEW)
  - Action: Mock `navigator.mediaDevices` → test MediaStream detection
  - Action: Mock missing APIs → verify `compatible: false` returned
  - Action: Test `getBrowserInfo()` → verify parsing of user agent (optional, can be simple)
  - Notes: Use Vitest's global mocks for navigator object

- [ ] **Task 8.5**: Performance testing & optimization
  - Action: Measure FPS for each filter at 1080p (Canvas2D vs WebGL)
  - Action: Measure filter stack overhead (1 filter vs 5 filters FPS delta)
  - Action: Profile localStorage save time (should be <50ms even with debouncing)
  - Action: Identify bottlenecks, optimize if any filter <20 FPS with 5-filter stack
  - Action: **F21 FIX** - Run ESLint before final commit: `npm run lint` → ZERO errors allowed
  - Action: **F21 FIX** - Run Prettier check: `npm run format:check` → ZERO formatting issues
  - Action: **F21 FIX** - Run TypeScript compiler: `npm run type-check` → ZERO type errors
  - Action: **F21 FIX** - Quality gate checklist before merge:
    - ✅ All tests passing (`npm test`)
    - ✅ 80%+ coverage (`npm run test:coverage`)
    - ✅ Zero ESLint errors
    - ✅ Zero TypeScript errors
    - ✅ Zero Prettier violations
  - Notes: Use Chrome DevTools Performance tab, document results in tech-spec

### Acceptance Criteria

**AC 1 - Dynamic Filter Parameters:**

- [ ] AC 1.1: Given I select the "Blur" filter, when I adjust the "Blur Strength" slider from 5 to 10, then the video should display a more blurred image in real-time (no lag, no "Apply" button needed)
- [ ] AC 1.2: Given I have adjusted Blur strength to 10, when I reload the page, then the Blur filter should load with strength 10 (localStorage persistence)
- [ ] AC 1.3: Given I open the Advanced Settings modal, when I adjust the "Glitch Frequency" slider, then both the modal slider AND the main panel contextual slider (if Glitch is active) should update in sync
- [ ] AC 1.4: Given I adjust a slider to a value outside the valid range (e.g., negative), when the parameter is applied, then the filter should clamp the value to the valid range (min/max) and not crash
- [ ] AC 1.5: Given I click the "Reset" button on the Vignette section in Advanced Settings, when the reset completes, then all Vignette parameters should return to default values (0.6 strength) and the UI sliders should reflect this
- [ ] AC 1.6: Given I have customized 5 different filters, when I click "Reset All" in Advanced Settings, then all 39 parameters across all 17 filters should reset to defaults

**AC 2 - Filter Stacking:**

- [ ] AC 2.1: Given I have the "Vignette" filter active, when I click "Add Filter" and select "Sepia", then the UI should show "Vignette → Sepia" chips in the filter pipeline section
- [ ] AC 2.2: Given I have a 3-filter stack (Vignette → Sepia → Blur), when I click the "X" on the "Sepia" chip, then the stack should update to "Vignette → Blur" and the video should apply only those 2 filters
- [ ] AC 2.3: Given I have 5 filters in the stack (max), when I try to add a 6th filter, then the "Add Filter" dropdown should be disabled or display a warning toast ("Max 5 filters allowed")
- [ ] AC 2.4: Given I have a custom filter stack, when I reload the page, then the exact same filter stack (types + order) should be restored from localStorage
- [ ] AC 2.5: **F4 FIX** - Given I have a 5-filter stack (3 heavy + 2 light filters) at 720p, when the video plays, then the FPS should be at least 15 FPS (realistic performance target)
- [ ] AC 2.6: **F1 FIX** - Given I try to add the same FilterType twice to the stack (e.g., Vignette → Blur → Vignette), when I attempt to add the duplicate, then the UI should prevent it (single-instance constraint) with an error message

**AC 3 - Presets:**

- [ ] AC 3.1: Given I select the "Cinematic" preset, when the preset loads, then the filter stack should show "DepthOfField → Vignette" with DoF focus=0.25, blur=11, Vignette strength=0.7
- [ ] AC 3.2: Given I select the "Cyberpunk" preset, when the preset loads, then the filter stack should show "Glitch → ChromaticAberration → CRT" with the correct parameters (high Glitch intensity, 7px Chromatic offset, 0.4 CRT scanline)
- [ ] AC 3.3: Given I have a custom filter stack and parameters, when I select a preset, then the preset should REPLACE my custom stack entirely (not merge)
- [ ] AC 3.4: Given I select a preset, when I adjust one of the parameters, then the preset should remain loaded but the parameters should be customized (preset is just an initial state)
- [ ] AC 3.5: Given I select each of the 5 presets in sequence, when each loads, then all should render correctly without errors and match their documented configurations

**AC 4 - Animations:**

- [ ] AC 4.1: Given I enable "Auto-Rotate" on the Kaleidoscope filter, when the video plays, then the kaleidoscope pattern should rotate smoothly at the configured speed (default 0.5°/frame)
- [ ] AC 4.2: Given I adjust the rotation speed slider to 2.0, when the video plays with auto-rotate enabled, then the rotation speed should be noticeably faster (2.0°/frame)
- [ ] AC 4.3: Given the Glitch filter is active, when the video plays for 2+ seconds, then the glitch frequencies should vary randomly every 1-2 seconds (temporal variation visible)
- [ ] AC 4.4: Given "Smooth Transitions" is enabled (default), when I switch from "Blur" to "Vignette" filter, then there should be a 300ms crossfade transition (no abrupt jump)
- [ ] AC 4.5: Given "Smooth Transitions" is disabled, when I switch filters, then the change should be instant (no crossfade)
- [ ] AC 4.6: Given I have auto-rotate enabled and speed set to 1.5, when I reload the page, then the Kaleidoscope should restore with auto-rotate ON and speed 1.5 (localStorage)

**AC 5 - WebGL Acceleration:**

- [ ] AC 5.1: Given WebGL is available in my browser, when I enable "Use GPU Acceleration", then the Blur, DoF, and OilPainting filters should use WebGL shaders instead of Canvas2D
- [ ] AC 5.2: Given I enable WebGL, when I measure FPS for the Blur filter at 1080p, then the WebGL version should be at least 1.5x faster than the Canvas2D version
- [ ] AC 5.3: Given WebGL is NOT available (old browser or disabled), when I enable the "Use GPU Acceleration" checkbox, then a warning toast should appear ("WebGL not supported, using Canvas2D") and the checkbox should auto-disable
- [ ] AC 5.4: **F5 FIX** - Given WebGL context is lost mid-session (GPU crash), when the context loss event fires, then the app should auto-disable WebGL checkbox, show Toast.warning("GPU acceleration disabled due to error"), rebuild filter stack with Canvas2D versions, and continue rendering without user intervention
- [ ] AC 5.5: Given I toggle WebGL ON and reload the page, when the app starts, then WebGL should still be enabled (localStorage persistence)
- [ ] AC 5.6: **F5 FIX** - Given a WebGL shader compilation error occurs for OilPainting filter, when the error is caught, then the app should fall back to Canvas2D version for that specific filter only (other WebGL filters continue) and log the error

**AC 6 - Browser Compatibility:**

- [ ] AC 6.1: Given I open the app in a compatible browser (Chrome 90+), when the app loads, then no browser warning should appear
- [ ] AC 6.2: **F9 FIX** - Given I open the app in Safari 14+, when the app loads, then a Toast.warning should appear: "Safari users may experience reduced performance with OilPainting and DepthOfField filters"
- [ ] AC 6.3: Given the browser compatibility check detects missing MediaStream API, when the warning displays, then the warning should list "MediaStream" as a missing feature
- [ ] AC 6.4: Given I dismiss the browser warning toast, when I interact with the app, then the warning should not appear again during the same session (but may appear on reload)
- [ ] AC 6.5: Given I read the README, when I look for browser compatibility info, then there should be a clear table with tested browser versions and a "Known Issues" section

**AC 7 - LocalStorage Persistence:**

- [ ] AC 7.1: Given I customize 10 filter parameters, enable WebGL, create a 3-filter stack, and select smooth transitions, when I reload the page, then ALL settings should be restored exactly (params, stack, WebGL, transitions)
- [ ] AC 7.2: **F3 FIX** - Given I customize settings and close the tab within 100ms (before debounce completes), when I reopen the app, then all settings should still be restored (beforeunload flush worked)
- [ ] AC 7.3: Given localStorage quota is exceeded (mock scenario), when the app tries to save settings, then Toast.error("Settings could not be saved") should appear and the app should continue functioning (no crash)
- [ ] AC 7.4: Given localStorage contains corrupted JSON data, when the app tries to load settings, then the app should log an error and start with default settings (no crash)
- [ ] AC 7.5: Given I drag a slider continuously for 2 seconds, when I stop, then the save to localStorage should occur within 500ms (debounced, not on every mousemove)

**AC 8 - Error Handling & Edge Cases:**

- [ ] AC 8.1: **F6 FIX** - Given I rapidly switch between 10 different filters (including DepthOfField, Pixelate), when each switch occurs, then the app should call cleanup() on removed filters and remain stable with no memory leaks (verify via Chrome DevTools memory profiler showing flat memory usage after switches)
- [ ] AC 8.2: Given I create a 5-filter stack and adjust parameters while the video is paused, when I resume the video, then all filters should apply correctly with the adjusted parameters
- [ ] AC 8.3: **F7 FIX** - Given a filter receives invalid parameters (NaN, Infinity, out-of-range values), when setParameters() is called, then the filter should clamp/reject invalid values, log a warning, and not crash
- [ ] AC 8.4: Given I enable a filter that doesn't have `setParameters()` implemented (e.g., Invert), when I select that filter, then no sliders should appear for that filter (backwards compatibility)
- [ ] AC 8.5: **F4 FIX** - Given the app is running at 1080p with 5 heavy filters (Blur kernelSize=15, OilPainting radius=7, DepthOfField maxBlur=15, CRT, VHS), when the video plays, then the FPS may degrade to <15 FPS (acceptable degradation, app doesn't crash)
- [ ] AC 8.6: **F22 FIX** - Given a filter crashes during apply() (throw Error), when the error occurs, then RenderPipeline should catch the error, remove the crashed filter from stack, show Toast.error("Filter X disabled due to error"), and continue rendering with remaining filters
- [ ] AC 8.7: **F2 FIX** - Given I compile the project with TypeScript strict mode, when compilation completes, then there should be zero `any` type errors related to FilterParameters (type safety verified at compile time)
- [ ] AC 8.8: **F23 FIX - Toast System** - Given multiple toast notifications are triggered rapidly (5 toasts in 1 second), when the queue fills, then max 3 toasts should be visible simultaneously with FIFO queueing (oldest dismissed first)
- [ ] AC 8.9: **F23 FIX** - Given a Toast.info() is displayed, when 3 seconds pass, then the toast should auto-dismiss with fade-out animation
- [ ] AC 8.10: **F23 FIX** - Given a Toast.error() is displayed, when 8 seconds pass, then the toast should auto-dismiss (longer duration for critical messages)
- [ ] AC 8.11: **F23 FIX** - Given a toast notification is visible, when I click the close button, then it should dismiss immediately (manual override)
- [ ] AC 8.12: **F13 FIX** - Given I drag a slider with step=0.05, when I release at value 0.327, then the displayed value should snap to nearest step (0.35) and that value should be applied to the filter
- [ ] AC 8.13: **F11 FIX** - Given I switch language from French to English, when the UI re-renders, then all 39 parameter labels should display in English with correct units (e.g., "Blur Strength (px)" not missing translation)

## Additional Context

### Dependencies

**Runtime Dependencies (already in package.json):**

- None new required (leveraging existing Canvas2D, WebGL, LocalStorage browser APIs)

**Dev Dependencies (verify compatibility):**

- TypeScript 5.3.3 (current)
- Vite 7.3.1 (current)
- Vitest 2.1.0 (current, for testing new components)
- ESLint 9.18.0 (current)
- Prettier 3.2.0 (current)

**Potential New Additions:**

- `gl-matrix` library for WebGL matrix math (if needed for shaders) - evaluate during implementation

### Testing Strategy

**Unit Tests (Vitest):**

- FilterParameterManager: subscribe/notify, updateParam, resetToDefaults
- SettingsStorage: save/load/clear, JSON serialization
- BrowserCompatibility: API detection logic (mock navigator APIs)
- Filter setParameters: Verify parameter application changes filter behavior
- Preset application: Load preset → verify filter stack + params match definition

**Integration Tests:**

- Full filter stack pipeline: Apply 3-5 filters sequentially, verify final ImageData
- LocalStorage persistence: Save settings → reload page → verify restoration
- WebGL fallback: Mock WebGL failure → verify Canvas2D fallback active

**Manual Testing (Critical Paths):**

- Slider interaction: Drag sliders → verify real-time visual updates (no lag, no "Apply" needed)
- Filter stacking: Add 5 filters → verify order, remove middle filter → verify stack updates
- Preset loading: Select each of 5 presets → verify correct filters + parameters applied
- Transitions: Switch filters rapidly → verify smooth crossfade (no flicker)
- Advanced modal: Open modal → adjust sliders → verify main panel sliders stay in sync
- Browser warning: Test in old browser (Safari 10) → verify warning modal appears

**Performance Testing:**

- Baseline: Measure FPS for each filter individually (existing V5 data available)
- Filter stack: Measure FPS for 1, 3, 5 filter stacks (target 25+ FPS for 5 filters @ 1080p)
- WebGL vs Canvas2D: Compare FPS for Blur, DoF, OilPainting (WebGL should be 1.5-3x faster)
- LocalStorage overhead: Measure save/load time (should be <50ms)

### Notes

**Phase 1 vs Phase 2 Implementation:**

- Recommend implementing all 39 sliders in **one pass** (not separate phases) to avoid rework
- UI can use same component for simple/complex filters (just render N sliders dynamically)
- Testing easier if all filters have consistent `setParameters` interface

**WebGL Shader Complexity:**

- Blur: Separable Gaussian = 2 shader passes (horizontal + vertical), moderate complexity
- DoF: Progressive blur = variable kernel size per pixel, **high complexity**
- OilPainting: Bilateral filter approximation, **very high complexity**
- Estimate: 8-12 hours dev time per WebGL filter (shader code + debugging)
- Fallback critical: Must gracefully handle WebGL unavailable or shader compile errors

**Accessibility Considerations (Future):**

- Slider keyboard navigation (arrow keys to adjust) - HTML5 range inputs support this natively
- ARIA labels for screen readers - add `aria-label` to sliders
- High contrast mode compatibility - test slider visibility
- Defer full accessibility audit to V7, but follow basic practices in V6

**Performance Budget (REVISED after adversarial review):**

- Single filter: 30+ FPS @ 1080p (existing V5 baseline)
- 3-filter stack (light filters): 25+ FPS @ 1080p
- 3-filter stack (heavy filters like OilPainting/DoF): 15+ FPS @ 720p
- 5-filter stack: NOT RECOMMENDED for heavy filters - UI should warn if stack contains 2+ heavy filters
- Heavy filter classification: Blur, DepthOfField, OilPainting, ComicBook (>30ms/frame @ 1080p)
- WebGL acceleration target: 1.5-3x speedup (30-90 FPS for heavy filters @ 1080p)
- **Rationale**: 5 heavy filters @ 1080p = 83MB memory bandwidth + 250ms compute time → impossible to hit 20 FPS on CPU. Revised targets are empirically achievable.

**Known Technical Debt to Address:**

- Some filters (Sepia, Thermal) have no adjustable parameters due to hardcoded matrices/palettes
- Refactoring these requires significant changes (Phase 3, deferred to V7)
- Document as limitations: "Sepia and Thermal filters do not support parameter adjustment in V6"
