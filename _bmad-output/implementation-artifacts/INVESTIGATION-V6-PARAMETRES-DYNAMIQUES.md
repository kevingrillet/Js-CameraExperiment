# Investigation Technique Approfondie - Système de Paramètres Dynamiques V6

**Date**: 2026-01-23  
**Objectif**: Mapper précisément l'architecture existante pour implémenter le système de paramètres dynamiques V6

---

## 1. Filter Instantiation Pattern

### 1.1 Comment App.constructor() Crée les Filtres

**Code exact** ([src/main.ts](src/main.ts#L57-L79)):

```typescript
// Initialize all filters
this.filters = new Map([
  ["none", new NoneFilter()],
  ["ascii", new AsciiFilter()],
  ["blur", new BlurFilter()],
  ["chromatic", new ChromaticAberrationFilter()],
  ["comicbook", new ComicBookFilter()],
  ["crt", new CRTFilter()],
  ["dof", new DepthOfFieldFilter()],
  ["edge", new EdgeDetectionFilter()],
  ["glitch", new GlitchFilter()],
  ["invert", new InvertFilter()],
  ["kaleidoscope", new KaleidoscopeFilter()],
  ["motion", new MotionDetectionFilter()],
  ["nightvision", new NightVisionFilter()],
  ["oilpainting", new OilPaintingFilter()],
  ["pixelate", new PixelateFilter()],
  ["rotoscope", new RotoscopeFilter()],
  ["sepia", new SepiaFilter()],
  ["sobelrainbow", new SobelRainbowFilter()],
  ["thermal", new ThermalFilter()],
  ["vhs", new VHSFilter()],
  ["vignette", new VignetteFilter()],
]);
```

**Pattern critique**:

- ✅ **Tous les filtres sont instanciés UNE SEULE FOIS au démarrage** dans `App.constructor()`
- ✅ **Stockés dans une Map<FilterType, Filter>** pour lookup rapide
- ✅ **Les instances sont RÉUTILISÉES** à chaque changement de filtre (pas de recréation)

### 1.2 Comment RenderPipeline.setFilter() Change de Filtre

**Code exact** ([src/core/RenderPipeline.ts](src/core/RenderPipeline.ts#L95-L108)):

```typescript
/**
 * Change the active filter
 * @param filter - The new filter to apply
 * @param filterType - Type of the filter for tracking
 */
setFilter(filter: Filter, filterType: FilterType): void {
  this.currentFilterType = filterType;

  // Cleanup old filter if it has cleanup method
  if (this.currentFilter.cleanup !== undefined) {
    try {
      this.currentFilter.cleanup();
    } catch (error) {
      Logger.error(
        "Filter cleanup failed",
        error instanceof Error ? error : undefined,
        "RenderPipeline"
      );
    }
  }
  this.currentFilter = filter;
}
```

**Pattern critique**:

- ✅ **Appelle `cleanup()` sur l'ancien filtre** (si la méthode existe)
- ✅ **Remplace simplement la référence** `this.currentFilter`
- ✅ **PAS de recréation** - l'instance existe déjà dans `App.filters` Map

### 1.3 Flow Complet de Changement de Filtre

**Séquence** ([src/main.ts](src/main.ts#L287-L300)):

```typescript
private handleFilterChanged(filterType: FilterType): void {
  const filter = this.filters.get(filterType);
  if (filter === undefined) {
    return;
  }

  // Cleanup previous filter if it has a cleanup method
  const currentFilterType = this.renderPipeline.getCurrentFilterType();
  if (currentFilterType !== filterType) {
    const previousFilter = this.filters.get(currentFilterType);
    if (previousFilter?.cleanup !== undefined) {
      previousFilter.cleanup();
    }
  }

  this.renderPipeline.setFilter(filter, filterType);
}
```

**Flow**:

1. User selects filter → `SettingsOverlay` triggers `onFilterChanged(filterType)`
2. `App.handleFilterChanged()` récupère l'instance existante dans `this.filters.get()`
3. Appelle `cleanup()` sur l'ancien filtre
4. Appelle `RenderPipeline.setFilter()` avec nouvelle instance
5. Render loop utilise `this.currentFilter.apply(imageData)` ([RenderPipeline.ts](src/core/RenderPipeline.ts#L259))

**Implication pour V6**:

- ❌ **PROBLÈME MAJEUR**: Impossible de passer des paramètres dynamiques au constructor
- ✅ **SOLUTION**: Ajouter une méthode `setParameters(params)` sur l'interface Filter
- ✅ **Callback flow**: `SettingsOverlay` → `App` → `RenderPipeline` → `Filter.setParameters()`

---

## 2. Paramètres Pattern (par type de filtre)

### 2.1 Simple Filters - Stateless In-Place (ex: VignetteFilter)

**Code exact** ([src/filters/VignetteFilter.ts](src/filters/VignetteFilter.ts#L9-L13)):

```typescript
export class VignetteFilter implements Filter {
  /**
   * Strength of vignette darkening at edges (0-1)
   * 0.6 creates strong artistic vignette effect (60% darkening at corners)
   */
  private readonly VIGNETTE_STRENGTH = 0.6;
```

**Pattern**:

- ✅ **Constante privée `readonly`** définie au niveau de la classe
- ✅ **Pas de constructor args** (constructeur par défaut)
- ✅ **Aucun buffer privé** - traite ImageData in-place
- ✅ **Pas de cleanup()** - stateless

**apply() usage**:

```typescript
const multiplier = 1 - darkness;
data[i] = data[i]! * multiplier; // R
```

**Migration V6**:

```diff
- private readonly VIGNETTE_STRENGTH = 0.6;
+ private vignetteStrength: number = 0.6;

+ setParameters(params: FilterParameters): void {
+   if (params.strength !== undefined) {
+     this.vignetteStrength = params.strength;
+   }
+ }
```

### 2.2 Simple Filters - Single Buffer (ex: BlurFilter)

**Code exact** ([src/filters/BlurFilter.ts](src/filters/BlurFilter.ts#L16-L35)):

```typescript
export class BlurFilter implements Filter {
  /**
   * Blur kernel size (5×5 grid)
   * Value of 5 provides visible blur while maintaining 30+ FPS on 1080p
   */
  private readonly KERNEL_SIZE = 5;

  /**
   * Half of kernel size, used for offset calculations
   */
  private readonly KERNEL_RADIUS = Math.floor(this.KERNEL_SIZE / 2);

  /**
   * Temporary buffer for horizontal blur pass result
   * Reused across frames to avoid allocations in render loop
   * Reallocated only when image dimensions change
   */
  private tempBuffer: Uint8ClampedArray | null = null;
```

**Pattern**:

- ✅ **1 paramètre**: `KERNEL_SIZE`
- ✅ **1 buffer privé**: `tempBuffer` (réalloué si dimensions changent)
- ✅ **cleanup()** existe ([BlurFilter.ts](src/filters/BlurFilter.ts#L115-L125)):

```typescript
cleanup(): void {
  this.tempBuffer = null;
  this.originalDataBuffer = null;
}
```

**apply() buffer allocation** ([BlurFilter.ts](src/filters/BlurFilter.ts#L50-L53)):

```typescript
// Ensure temp buffer is allocated and sized correctly
const expectedLength = width * height * 4;
if (this.tempBuffer?.length !== expectedLength) {
  this.tempBuffer = new Uint8ClampedArray(expectedLength);
}
```

**Migration V6**:

```diff
- private readonly KERNEL_SIZE = 5;
- private readonly KERNEL_RADIUS = Math.floor(this.KERNEL_SIZE / 2);
+ private kernelSize: number = 5;
+ private get kernelRadius(): number { 
+   return Math.floor(this.kernelSize / 2); 
+ }

+ setParameters(params: FilterParameters): void {
+   if (params.kernelSize !== undefined) {
+     this.kernelSize = params.kernelSize;
+     // Note: kernelRadius recalculated via getter
+     // May need to invalidate buffers if kernel size affects allocation
+   }
+ }
```

### 2.3 Complex Filters - Multiple Buffers (ex: DepthOfFieldFilter)

**Code exact** ([src/filters/DepthOfFieldFilter.ts](src/filters/DepthOfFieldFilter.ts#L10-L28)):

```typescript
export class DepthOfFieldFilter implements Filter {
  /**
   * Focus zone radius as ratio of minimum dimension (width or height)
   * 0.3 = 30% of min dimension
   */
  private readonly FOCUS_RADIUS_RATIO = 0.3;

  /**
   * Maximum blur kernel size at image edges
   * 9 = strong bokeh effect without severe performance degradation
   */
  private readonly MAX_BLUR_KERNEL = 9;

  /**
   * Temporary buffer for blur passes (reused across frames)
   */
  private blurBuffer: Uint8ClampedArray | null = null;

  /**
   * Pre-computed distance map (pixels to focus zone center)
   * Reused if dimensions unchanged, avoiding expensive sqrt() per frame
   */
  private distanceMap: Float32Array | null = null;
  private lastWidth = 0;
  private lastHeight = 0;
```

**Pattern**:

- ✅ **2 paramètres**: `FOCUS_RADIUS_RATIO`, `MAX_BLUR_KERNEL`
- ✅ **3 buffers privés**: `blurBuffer`, `distanceMap`, dimension tracking
- ✅ **cleanup()** n'existe PAS (pas implémentée) - **BUG potentiel**
- ✅ **Buffer invalidation** basée sur dimensions ([DepthOfFieldFilter.ts](src/filters/DepthOfFieldFilter.ts#L78-L92)):

```typescript
// Compute or reuse distance map
if (
  this.distanceMap === null ||
  width !== this.lastWidth ||
  height !== this.lastHeight
) {
  this.distanceMap = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.distanceMap[y * width + x] = isFinite(distance) ? distance : 0;
    }
  }
  this.lastWidth = width;
  this.lastHeight = height;
}
```

**Migration V6**:

```diff
- private readonly FOCUS_RADIUS_RATIO = 0.3;
- private readonly MAX_BLUR_KERNEL = 9;
+ private focusRadiusRatio: number = 0.3;
+ private maxBlurKernel: number = 9;

+ setParameters(params: FilterParameters): void {
+   if (params.focusRadius !== undefined) {
+     this.focusRadiusRatio = params.focusRadius;
+     // Invalidate distance map if focus radius changes
+     this.distanceMap = null;
+   }
+   if (params.blurStrength !== undefined) {
+     this.maxBlurKernel = params.blurStrength;
+     // Buffer size unchanged - only blur kernel size changes
+   }
+ }

+ cleanup(): void {
+   this.blurBuffer = null;
+   this.distanceMap = null;
+ }
```

### 2.4 Temporal Filters - Stateful (ex: GlitchFilter, MotionDetectionFilter)

**Code exact - GlitchFilter** ([src/filters/GlitchFilter.ts](src/filters/GlitchFilter.ts#L17-L58)):

```typescript
export class GlitchFilter implements Filter {
  /**
   * Probability of horizontal line shift per scanline (10%)
   */
  private readonly LINE_SHIFT_PROBABILITY = 0.1;

  /**
   * Probability of RGB channel separation per frame (15%)
   */
  private readonly RGB_SEPARATION_PROBABILITY = 0.15;

  /**
   * Maximum RGB channel offset in pixels (±10px)
   */
  private readonly RGB_OFFSET_MAX = 10;

  /**
   * Probability of block corruption per 8x8 block (5%)
   */
  private readonly BLOCK_CORRUPTION_PROBABILITY = 0.05;

  /**
   * Minimum glitch persistence in frames
   */
  private readonly GLITCH_TTL_MIN = 2;

  /**
   * Maximum glitch persistence in frames
   */
  private readonly GLITCH_TTL_MAX = 3;

  /**
   * Maximum active glitches cap (FIFO eviction)
   * CRITICAL: Prevents memory leak from unbounded growth
   */
  private readonly MAX_ACTIVE_GLITCHES = 50;

  /**
   * Active glitches with temporal persistence
   * FIFO eviction when length exceeds MAX_ACTIVE_GLITCHES
   */
  private activeGlitches: ActiveGlitch[] = [];
```

**Code exact - MotionDetectionFilter** ([src/filters/MotionDetectionFilter.ts](src/filters/MotionDetectionFilter.ts#L8-L34)):

```typescript
export class MotionDetectionFilter implements Filter {
  private previousFrame: Uint8ClampedArray | null = null;
  private currentFrameBuffer: Uint8ClampedArray | null = null;
  private motionHeatmap: Uint8ClampedArray | null = null;

  /**
   * Minimum pixel difference (0-255) to consider as motion
   */
  private readonly MOTION_THRESHOLD = 25;

  /**
   * Noise reduction threshold to filter out camera sensor noise
   */
  private readonly NOISE_REDUCTION = 3;

  /**
   * Decay factor for motion trail (0-1)
   * Higher values = motion fades slower (longer trail)
   */
  private readonly DECAY_FACTOR = 0.9;
```

**Pattern**:

- ✅ **Multiple paramètres probabilités/thresholds**
- ✅ **État temporel** (`activeGlitches[]`, `previousFrame`)
- ✅ **cleanup()** implémentée ([GlitchFilter.ts](src/filters/GlitchFilter.ts#L260-L266)):

```typescript
cleanup(): void {
  this.activeGlitches = [];
}
```

**Migration V6 - Points d'attention**:

- ⚠️ **Invalidation d'état**: Changer certains paramètres peut nécessiter reset
- ⚠️ **MotionDetectionFilter**: Si `MOTION_THRESHOLD` change, ne PAS reset `previousFrame` (sinon faux positifs)
- ⚠️ **GlitchFilter**: Changer `MAX_ACTIVE_GLITCHES` nécessite FIFO cap enforcement

### 2.5 No-Parameter Filters (ex: NoneFilter, InvertFilter)

**Code exact - NoneFilter** ([src/filters/NoneFilter.ts](src/filters/NoneFilter.ts#L6-L11)):

```typescript
export class NoneFilter implements Filter {
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);
    // Return the image data unchanged
    return imageData;
  }
}
```

**Pattern**:

- ✅ **Aucun paramètre**
- ✅ **Stateless**
- ✅ **Pas de cleanup()**

**V6 handling**:

- ✅ **Interface `setParameters()` reste optionnelle** (ou no-op)
- ✅ **UI cache ces filtres dans le paramètre panel**

---

## 3. SettingsOverlay Structure Exacte

### 3.1 HTML Structure

**Gear button + Panel** ([src/ui/SettingsOverlay.ts](src/ui/SettingsOverlay.ts#L55-L140)):

```typescript
overlay.innerHTML = `
  <button class="gear-button" title="${t.settings}">
    <svg>...</svg>
  </button>
  
  <button class="download-button" title="${t.downloadImage}">
    <svg>...</svg>
  </button>
  
  <div class="settings-panel">
    <h3>${t.settings}</h3>
    
    <div class="setting-group language-selector">
      <button class="flag-button" data-lang="fr">🇫🇷</button>
      <button class="flag-button" data-lang="en">🇬🇧</button>
    </div>
    
    <div class="setting-group">
      <label>${t.videoSource}</label>
      <select id="source-select">...</select>
      <input type="file" id="image-upload">
      <button id="upload-button">${t.loadImage}</button>
    </div>

    <div class="setting-group">
      <label>${t.filter}</label>
      <select id="filter-select">
        ${sortedFilters.map(f => `<option value="${f.type}">${t.filters[f.type]}</option>`).join("")}
      </select>
    </div>

    <div class="setting-group">
      <label>
        <input type="checkbox" id="fps-toggle">
        ${t.showFPS}
      </label>
    </div>

    <div class="setting-group">
      <label>${t.aspectRatio}</label>
      <div class="radio-group">
        <label><input type="radio" name="aspect-ratio" value="contain" checked>${t.contain}</label>
        <label><input type="radio" name="aspect-ratio" value="cover">${t.cover}</label>
      </div>
    </div>
  </div>
`;
```

**Structure pattern**:

- ✅ **`.settings-panel`** contient tous les contrôles
- ✅ **`.setting-group`** wrap chaque contrôle (label + input)
- ✅ **IDs fixes** pour sélecteurs: `#source-select`, `#filter-select`, `#fps-toggle`, etc.

### 3.2 Event Listeners Pattern

**Setup** ([src/ui/SettingsOverlay.ts](src/ui/SettingsOverlay.ts#L147-L245)):

```typescript
private setupEventListeners(): void {
  // Gear button toggle
  this.gearButton.addEventListener("click", (e) => {
    e.stopPropagation();
    this.togglePanel();
  });

  // Download button
  const downloadButton = this.container.querySelector(".download-button") as HTMLButtonElement;
  downloadButton.addEventListener("click", (e) => {
    e.stopPropagation();
    this.callbacks.onDownloadClicked();
  });

  // Filter select
  const filterSelect = this.panel.querySelector("#filter-select") as HTMLSelectElement;
  filterSelect.addEventListener("change", (e): void => {
    const target = e.target as HTMLSelectElement;
    this.callbacks.onFilterChanged(target.value as FilterType);
  });

  // FPS toggle
  const fpsToggle = this.panel.querySelector("#fps-toggle") as HTMLInputElement;
  fpsToggle.addEventListener("change", (e): void => {
    const target = e.target as HTMLInputElement;
    this.callbacks.onFPSToggled(target.checked);
  });

  // Aspect ratio
  const aspectRadios = this.panel.querySelectorAll('input[name="aspect-ratio"]');
  aspectRadios.forEach((radio) => {
    radio.addEventListener("change", (e): void => {
      const target = e.target as HTMLInputElement;
      this.callbacks.onAspectRatioChanged(target.value as AspectRatioMode);
    });
  });
```

**Pattern critique**:

- ✅ **querySelector by ID** pour récupérer les éléments
- ✅ **addEventListener** standard (pas de framework)
- ✅ **Callbacks** invoquées directement: `this.callbacks.onFilterChanged(value)`

### 3.3 Callback System - SettingsCallbacks Interface

**Interface** ([src/ui/SettingsOverlay.ts](src/ui/SettingsOverlay.ts#L8-L16)):

```typescript
export interface SettingsCallbacks {
  onWebcamSelected: (deviceId?: string) => void;
  onImageSelected: (file: File) => void;
  onFilterChanged: (filterType: FilterType) => void;
  onFPSToggled: (show: boolean) => void;
  onAspectRatioChanged: (mode: AspectRatioMode) => void;
  onLanguageChanged: (lang: Language) => void;
  onDownloadClicked: () => void;
}
```

**Usage dans App** ([src/main.ts](src/main.ts#L99-L128)):

```typescript
this.settingsOverlay = new SettingsOverlay({
  onWebcamSelected: (deviceId?: string): void => {
    void this.handleWebcamSelected(deviceId);
  },
  onImageSelected: (file: File): void => {
    void this.handleImageSelected(file);
  },
  onFilterChanged: (filterType: FilterType): void =>
    this.handleFilterChanged(filterType),
  onFPSToggled: (show: boolean): void =>
    this.renderPipeline.setShowFPS(show),
  onAspectRatioChanged: (mode): void =>
    this.renderPipeline.setAspectRatioMode(mode),
  onLanguageChanged: (lang: Language): void =>
    this.handleLanguageChanged(lang),
  onDownloadClicked: (): void => {
    void this.handleDownloadClick();
  },
});
```

### 3.4 Comment Ajouter un Nouveau Contrôle (Slider pour Paramètre)

**Pattern exact à suivre**:

1. **Ajouter au HTML template** (dans `createOverlay()`):

```typescript
// APRÈS le filter-select, AVANT le fps-toggle
<div class="setting-group filter-parameters" id="filter-params-container" style="display: none;">
  <label>Blur Strength</label>
  <input type="range" id="param-blur-strength" min="3" max="15" step="2" value="5" class="setting-control">
  <span id="param-blur-strength-value">5</span>
</div>
```

1. **Ajouter callback à l'interface**:

```typescript
export interface SettingsCallbacks {
  // ... existing callbacks
  onFilterParameterChanged?: (paramName: string, value: number) => void;
}
```

1. **Setup event listener** (dans `setupEventListeners()`):

```typescript
// Filter parameters slider (dynamic - setup when filter changes)
const paramContainer = this.panel.querySelector("#filter-params-container");
if (paramContainer) {
  const sliders = paramContainer.querySelectorAll("input[type='range']");
  sliders.forEach(slider => {
    slider.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const paramName = target.id.replace("param-", "");
      const value = parseFloat(target.value);
      
      // Update value display
      const valueSpan = this.panel.querySelector(`#${target.id}-value`);
      if (valueSpan) {
        valueSpan.textContent = target.value;
      }
      
      // Trigger callback
      this.callbacks.onFilterParameterChanged?.(paramName, value);
    });
  });
}
```

1. **Toggle visibility** basé sur le filtre sélectionné:

```typescript
// Dans handleFilterChanged ou après filter-select change event
private updateFilterParametersVisibility(filterType: FilterType): void {
  const paramContainer = this.panel.querySelector("#filter-params-container");
  
  // Show only for filters with parameters
  if (["blur", "dof", "glitch", "vignette"].includes(filterType)) {
    paramContainer.style.display = "block";
    this.loadParametersForFilter(filterType);
  } else {
    paramContainer.style.display = "none";
  }
}
```

---

## 4. Files to Modify - Liste Précise

### 4.1 Core Interfaces & Types

**Fichier**: [`src/types/index.ts`](src/types/index.ts)

**Modifications**:

- ✅ **Ajouter** `FilterParameters` interface:

  ```typescript
  export interface FilterParameters {
    // BlurFilter
    kernelSize?: number;
    
    // VignetteFilter
    strength?: number;
    
    // GlitchFilter
    glitchIntensity?: number;
    lineShiftProb?: number;
    rgbSeparationProb?: number;
    
    // DepthOfFieldFilter
    focusRadius?: number;
    blurStrength?: number;
    
    // MotionDetectionFilter
    motionThreshold?: number;
    decayFactor?: number;
    
    // ... other filter params
  }
  ```

- ✅ **Ajouter** `FilterMetadata` extension:

  ```typescript
  export interface FilterMetadata {
    type: FilterType;
    hasParameters?: boolean; // NEW
    parameterDefinitions?: ParameterDefinition[]; // NEW
  }
  
  export interface ParameterDefinition {
    name: string;
    displayName: string; // For UI labels
    type: "number" | "boolean";
    min?: number;
    max?: number;
    step?: number;
    default: number | boolean;
  }
  ```

- ✅ **Modifier** `AVAILABLE_FILTERS`:

  ```typescript
  export const AVAILABLE_FILTERS: FilterMetadata[] = [
    { type: "none" },
    { 
      type: "blur", 
      hasParameters: true,
      parameterDefinitions: [{
        name: "kernelSize",
        displayName: "Kernel Size",
        type: "number",
        min: 3,
        max: 15,
        step: 2,
        default: 5
      }]
    },
    // ... others
  ];
  ```

**Ordre**: **#1 - PREMIER FICHIER** (dépendance pour toutes les autres modifications)

---

### 4.2 Filter Interface

**Fichier**: [`src/filters/Filter.ts`](src/filters/Filter.ts)

**Modifications**:

- ✅ **Ajouter méthode optionnelle** `setParameters()`:

  ```typescript
  import type { FilterParameters } from "../types";
  
  export interface Filter {
    apply(imageData: ImageData): ImageData;
    cleanup?(): void;
    setParameters?(params: FilterParameters): void; // NEW
  }
  ```

**Ordre**: **#2** (après types/index.ts, avant implementation dans filtres individuels)

---

### 4.3 Individual Filter Implementations

**Fichiers** (dans l'ordre de complexité):

1. **Simple stateless** - [`src/filters/VignetteFilter.ts`](src/filters/VignetteFilter.ts)
   - Change `readonly VIGNETTE_STRENGTH` → `private vignetteStrength`
   - Ajouter `setParameters(params)` method
   - **Pas de cleanup() requis** (déjà stateless)

2. **Single buffer** - [`src/filters/BlurFilter.ts`](src/filters/BlurFilter.ts)
   - Change `readonly KERNEL_SIZE` → `private kernelSize`
   - Add getter for `kernelRadius`
   - Ajouter `setParameters(params)` method
   - **cleanup() déjà existant** ✅

3. **Multiple buffers** - [`src/filters/DepthOfFieldFilter.ts`](src/filters/DepthOfFieldFilter.ts)
   - Change `readonly FOCUS_RADIUS_RATIO` → `private focusRadiusRatio`
   - Change `readonly MAX_BLUR_KERNEL` → `private maxBlurKernel`
   - Ajouter `setParameters(params)` avec buffer invalidation
   - **AJOUTER cleanup()** ❌ (actuellement manquant)

4. **Temporal/Stateful** - [`src/filters/GlitchFilter.ts`](src/filters/GlitchFilter.ts)
   - 6+ paramètres probabilités
   - Ajouter `setParameters(params)`
   - **cleanup() déjà existant** ✅

5. **Temporal/Stateful** - [`src/filters/MotionDetectionFilter.ts`](src/filters/MotionDetectionFilter.ts)
   - 3 paramètres (threshold, noise, decay)
   - Ajouter `setParameters(params)`
   - ⚠️ **NE PAS** reset `previousFrame` lors du changement de paramètres

**Ordre**: **#3** (après Filter.ts interface update)

---

### 4.4 UI - SettingsOverlay

**Fichier**: [`src/ui/SettingsOverlay.ts`](src/ui/SettingsOverlay.ts)

**Modifications**:

1. **Ajouter callback** à `SettingsCallbacks` interface:

   ```typescript
   export interface SettingsCallbacks {
     // ... existing
     onFilterParameterChanged?: (filterType: FilterType, paramName: string, value: number | boolean) => void;
   }
   ```

2. **Ajouter au HTML template** (ligne ~115 après filter-select):

   ```typescript
   <div class="setting-group" id="filter-params-container" style="display: none;">
     <!-- Dynamically populated based on selected filter -->
   </div>
   ```

3. **Ajouter méthode** `updateFilterParameters(filterType: FilterType)`:

   ```typescript
   private updateFilterParameters(filterType: FilterType): void {
     const container = this.panel.querySelector("#filter-params-container");
     const metadata = AVAILABLE_FILTERS.find(f => f.type === filterType);
     
     if (!metadata?.hasParameters) {
       container.style.display = "none";
       return;
     }
     
     container.style.display = "block";
     container.innerHTML = ""; // Clear existing
     
     metadata.parameterDefinitions?.forEach(param => {
       // Create slider HTML
       // Setup event listeners
       // Call this.callbacks.onFilterParameterChanged
     });
   }
   ```

4. **Hook dans filter-select change listener** (ligne ~220):

   ```typescript
   filterSelect.addEventListener("change", (e): void => {
     const target = e.target as HTMLSelectElement;
     const filterType = target.value as FilterType;
     this.callbacks.onFilterChanged(filterType);
     this.updateFilterParameters(filterType); // NEW
   });
   ```

**Ordre**: **#4** (après types/index.ts pour accéder à `FilterMetadata`)

---

### 4.5 App - Main Orchestrator

**Fichier**: [`src/main.ts`](src/main.ts)

**Modifications**:

1. **Ajouter callback handler** dans `SettingsOverlay` constructor (ligne ~120):

   ```typescript
   this.settingsOverlay = new SettingsOverlay({
     // ... existing callbacks
     onFilterParameterChanged: (filterType, paramName, value): void => {
       this.handleFilterParameterChanged(filterType, paramName, value);
     },
   });
   ```

2. **Ajouter méthode** `handleFilterParameterChanged()`:

   ```typescript
   private handleFilterParameterChanged(
     filterType: FilterType,
     paramName: string,
     value: number | boolean
   ): void {
     const filter = this.filters.get(filterType);
     if (filter?.setParameters) {
       filter.setParameters({ [paramName]: value });
     }
   }
   ```

3. **Initialiser paramètres au startup** (si localStorage implémenté):

   ```typescript
   // Dans constructor après filter creation
   this.loadFilterParametersFromStorage();
   ```

**Ordre**: **#5** (après SettingsOverlay et Filter implementations)

---

### 4.6 Translations (i18n)

**Fichier**: [`src/i18n/translations.ts`](src/i18n/translations.ts)

**Modifications**:

- ✅ **Ajouter labels** pour paramètres de filtres:

  ```typescript
  export interface Translations {
    // ... existing
    filterParameters: {
      kernelSize: string;
      strength: string;
      focusRadius: string;
      blurStrength: string;
      motionThreshold: string;
      glitchIntensity: string;
      // ... others
    };
  }
  
  export const translations: Record<Language, Translations> = {
    fr: {
      // ... existing
      filterParameters: {
        kernelSize: "Taille du noyau",
        strength: "Intensité",
        focusRadius: "Rayon de focus",
        blurStrength: "Force du flou",
        motionThreshold: "Seuil de mouvement",
        glitchIntensity: "Intensité du glitch",
      },
    },
    en: {
      // ... existing
      filterParameters: {
        kernelSize: "Kernel Size",
        strength: "Strength",
        focusRadius: "Focus Radius",
        blurStrength: "Blur Strength",
        motionThreshold: "Motion Threshold",
        glitchIntensity: "Glitch Intensity",
      },
    },
  };
  ```

**Ordre**: **#6** (parallèle avec UI implementation)

---

## 5. Nouveaux Fichiers à Créer

### 5.1 SettingsStorage Utility (Optional - localStorage persistence)

**Chemin**: `src/core/SettingsStorage.ts`

**Responsabilité**:

- Save/load filter parameters to/from localStorage
- Schema versioning (v6)
- Migration from v5 (if exists)

**Interface**:

```typescript
export interface StoredSettings {
  version: number; // 6
  filterParameters: Record<FilterType, FilterParameters>;
  lastFilter?: FilterType;
  showFPS?: boolean;
  aspectRatio?: AspectRatioMode;
}

export class SettingsStorage {
  private static readonly STORAGE_KEY = "cameraExperimentSettings_v6";
  
  static save(settings: StoredSettings): void;
  static load(): StoredSettings | null;
  static clear(): void;
}
```

**Dépendances**: `types/index.ts` (FilterType, FilterParameters)

**Ordre**: **#7** (optionnel - peut être implémenté après V6 core)

---

### 5.2 Tests - Filter Parameter Tests

**Nouveaux fichiers**:

- `src/filters/__tests__/BlurFilter.parameters.test.ts`
- `src/filters/__tests__/VignetteFilter.parameters.test.ts`
- etc.

**Pattern** (basé sur existing tests):

```typescript
import { describe, it, expect } from "vitest";
import { BlurFilter } from "../BlurFilter";

describe("BlurFilter - Dynamic Parameters", () => {
  it("should apply kernel size change", () => {
    const filter = new BlurFilter();
    const imageData = createTestImageData(100, 100);
    
    // Default kernel size = 5
    filter.apply(imageData);
    
    // Change to kernel size = 9
    filter.setParameters({ kernelSize: 9 });
    filter.apply(imageData);
    
    // Verify stronger blur applied
    expect(imageData.data[0]).toBeLessThan(255); // Some blur
  });
  
  it("should preserve buffer allocation across parameter changes", () => {
    const filter = new BlurFilter();
    const imageData = createTestImageData(100, 100);
    
    filter.apply(imageData);
    filter.setParameters({ kernelSize: 7 });
    filter.apply(imageData);
    
    // No errors - buffer reused
    expect(imageData.data.length).toBe(100 * 100 * 4);
  });
});
```

**Ordre**: **#8** (après filter implementations - TDD optionnel)

---

## 6. Contraintes Techniques Identifiées

### 6.1 TypeScript Strict Mode

**Fichier config**: [`tsconfig.json`](tsconfig.json)

**Implications** (basé sur code existant):

- ✅ **Non-null assertions** (`!`) utilisées massivement dans filters
- ✅ **Strict boolean expressions** (ESLint rule active)
- ✅ **No implicit any** (toutes les signatures typées)

**Pour V6**:

- ✅ **FilterParameters** doit être type-safe (pas de `Record<string, any>`)
- ✅ **Optional chaining** pour `filter.setParameters?.(...)`
- ✅ **Type guards** pour valider parameter values

### 6.2 Performance - Zero Allocations

**Pattern observé** (BlurFilter, DepthOfFieldFilter):

```typescript
// Buffer allocation check
if (this.tempBuffer?.length !== expectedLength) {
  this.tempBuffer = new Uint8ClampedArray(expectedLength);
}

// Reuse buffer
this.tempBuffer.set(data);
```

**Contrainte V6**:

- ❌ **NE PAS** créer de nouveaux buffers lors de `setParameters()` si possible
- ✅ **Invalider buffers** seulement si dimensions ou taille logique changent
- ✅ **Exemple**: Changer `VIGNETTE_STRENGTH` ne nécessite AUCUNE allocation
- ⚠️ **Exemple**: Changer `KERNEL_SIZE` dans BlurFilter ne change PAS la taille du buffer (toujours width×height×4)

### 6.3 Cleanup Patterns Requis

**Filtres SANS cleanup() actuellement**:

- ❌ **DepthOfFieldFilter** - manque cleanup() malgré 2 buffers
- ❌ **PixelateFilter** - manque cleanup() malgré 1 buffer

**Action requise**:

```typescript
// Ajouter à DepthOfFieldFilter
cleanup(): void {
  this.blurBuffer = null;
  this.distanceMap = null;
  this.lastWidth = 0;
  this.lastHeight = 0;
}
```

**Règle V6**:

- ✅ **Tout filtre avec buffers DOIT avoir cleanup()**
- ✅ **cleanup() appelé automatiquement** lors du changement de filtre ([RenderPipeline.ts](src/core/RenderPipeline.ts#L99-L106))

### 6.4 Error Handling Patterns

**Pattern observé** (VignetteFilter):

```typescript
apply(imageData: ImageData): ImageData {
  try {
    validateImageData(imageData);
    // ... processing
    return imageData;
  } catch (error) {
    Logger.error(
      "VignetteFilter error:",
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}
```

**Contrainte V6**:

- ✅ **setParameters()** doit valider les valeurs:

  ```typescript
  setParameters(params: FilterParameters): void {
    if (params.kernelSize !== undefined) {
      if (params.kernelSize < 3 || params.kernelSize > 15) {
        Logger.warn("Invalid kernelSize, clamping to [3, 15]", "BlurFilter");
        this.kernelSize = Math.max(3, Math.min(15, params.kernelSize));
      } else {
        this.kernelSize = params.kernelSize;
      }
    }
  }
  ```

---

## 7. localStorage Usage

### 7.1 État Actuel - AUCUNE Utilisation

**Recherche exhaustive**:

```bash
grep -r "localStorage" src/
# Result: 0 matches
```

**Conclusion**:

- ❌ **localStorage N'EST PAS utilisé** dans l'app actuelle
- ✅ **Opportunité V6**: Première implémentation de persistence
- ✅ **Pas de migration legacy** nécessaire

### 7.2 Structure Proposée pour V6

**Schema localStorage**:

```typescript
// Key: "cameraExperimentSettings_v6"
{
  "version": 6,
  "filterParameters": {
    "blur": { "kernelSize": 7 },
    "vignette": { "strength": 0.8 },
    "dof": { "focusRadius": 0.25, "blurStrength": 11 },
    "glitch": { 
      "glitchIntensity": 0.7,
      "lineShiftProb": 0.15,
      "rgbSeparationProb": 0.2
    }
  },
  "lastFilter": "blur",
  "showFPS": true,
  "aspectRatio": "contain"
}
```

**Usage pattern**:

```typescript
// Save on parameter change
function handleFilterParameterChanged(filterType, paramName, value) {
  // Update filter
  filter.setParameters({ [paramName]: value });
  
  // Save to localStorage
  const settings = SettingsStorage.load() ?? createDefaultSettings();
  settings.filterParameters[filterType] = {
    ...settings.filterParameters[filterType],
    [paramName]: value
  };
  SettingsStorage.save(settings);
}

// Load on startup
function loadFilterParametersFromStorage() {
  const settings = SettingsStorage.load();
  if (settings) {
    Object.entries(settings.filterParameters).forEach(([filterType, params]) => {
      const filter = this.filters.get(filterType);
      filter?.setParameters?.(params);
    });
  }
}
```

---

## 8. Test Pattern

### 8.1 Structure des Tests Existants

**Framework**: Vitest ([package.json](package.json#L11-L13))

**Fichiers test**:

- `src/filters/__tests__/*.test.ts` (22 filter tests)
- `src/utils/__tests__/*.test.ts` (2 utility tests)

### 8.2 Mocking Pattern pour ImageData

**Pattern observé** ([BlurFilter.test.ts](src/filters/__tests__/BlurFilter.test.ts#L15-L23)):

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { BlurFilter } from "../BlurFilter";

describe("BlurFilter", () => {
  let filter: BlurFilter;

  beforeEach(() => {
    filter = new BlurFilter();
  });

  it("should allocate tempBuffer on first apply", () => {
    const imageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    } as ImageData; // Type assertion for mock

    // Fill with test pattern
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 64;
      imageData.data[i + 3] = 255;
    }

    filter.apply(imageData);
    expect(result.data.length).toBe(10 * 10 * 4);
  });
});
```

**Pattern**:

- ✅ **Pas de canvas mock** - utilise simple objects avec `as ImageData`
- ✅ **Manipulation directe** de `Uint8ClampedArray`
- ✅ **beforeEach()** pour reset state

### 8.3 Test Pattern pour Temporal Filters

**Exemple** ([GlitchFilter.test.ts](src/filters/__tests__/GlitchFilter.test.ts#L34-L77)):

```typescript
it("should decrement TTL and remove expired glitches", () => {
  const filter = new GlitchFilter();

  // Inject a glitch manually with TTL=2
  (filter as unknown as { activeGlitches: unknown[] }).activeGlitches = [
    { type: "shift", data: new Uint8ClampedArray(10), ttl: 2 },
  ];

  const imageData: ImageData = {
    data: new Uint8ClampedArray(100 * 4),
    width: 10,
    height: 10,
    colorSpace: "srgb" as PredefinedColorSpace,
  };

  // Mock Math.random to prevent new glitch creation
  const originalRandom = Math.random;
  Math.random = (): number => 1.0; // Above probability thresholds

  filter.apply(imageData); // TTL: 2 -> 1
  expect(filter.activeGlitches.length).toBe(1);

  filter.apply(imageData); // TTL: 1 -> 0, removed
  expect(filter.activeGlitches.length).toBe(0);

  // Restore Math.random
  Math.random = originalRandom;
});
```

**Pattern**:

- ✅ **Type assertion** pour accéder aux privés: `(filter as unknown as { ... })`
- ✅ **Mock Math.random** pour tests déterministes
- ✅ **Restore mocks** dans afterEach

### 8.4 Coverage Expectations

**Current coverage** (pas de .coverage/ folder trouvé - probablement pas configuré):

**Recommandation V6**:

- ✅ **Test tous les filtres avec paramètres**: BlurFilter, VignetteFilter, DepthOfFieldFilter, GlitchFilter
- ✅ **Test setParameters()** avec valeurs valides/invalides
- ✅ **Test buffer preservation** après changement de paramètres
- ✅ **Test cleanup()** après setParameters()

---

## 9. Ordre de Modification Recommandé (Roadmap V6)

### Phase 1: Interfaces & Types (Fondations)

1. ✅ [`src/types/index.ts`](src/types/index.ts)
   - Ajouter `FilterParameters` interface
   - Étendre `FilterMetadata` avec `parameterDefinitions`
   - Modifier `AVAILABLE_FILTERS` pour BlurFilter (test)

2. ✅ [`src/filters/Filter.ts`](src/filters/Filter.ts)
   - Ajouter méthode optionnelle `setParameters()`

### Phase 2: Filter Implementations (Par complexité croissante)

1. ✅ [`src/filters/VignetteFilter.ts`](src/filters/VignetteFilter.ts) - **PREMIER FILTRE**
   - Simple stateless (1 paramètre)
   - Change `readonly` → `private`
   - Ajouter `setParameters()`

2. ✅ [`src/filters/BlurFilter.ts`](src/filters/BlurFilter.ts) - **DEUXIÈME FILTRE**
   - Single buffer (1 paramètre)
   - Tester buffer preservation

3. ✅ [`src/filters/DepthOfFieldFilter.ts`](src/filters/DepthOfFieldFilter.ts) - **TROISIÈME FILTRE**
   - Multiple buffers (2 paramètres)
   - Ajouter `cleanup()` manquant
   - Buffer invalidation logic

4. ✅ [`src/filters/GlitchFilter.ts`](src/filters/GlitchFilter.ts) - **QUATRIÈME FILTRE**
   - Temporal stateful (6+ paramètres)
   - Test state preservation

### Phase 3: UI Layer

1. ✅ [`src/ui/SettingsOverlay.ts`](src/ui/SettingsOverlay.ts)
   - Ajouter `onFilterParameterChanged` callback
   - Créer `updateFilterParameters()` method
   - Générer sliders dynamiquement basé sur `FilterMetadata`

2. ✅ [`src/i18n/translations.ts`](src/i18n/translations.ts)
   - Ajouter `filterParameters` translations

### Phase 4: Orchestration

1. ✅ [`src/main.ts`](src/main.ts)
   - Ajouter `handleFilterParameterChanged()`
   - Connecter callbacks UI → Filter instances
   - Initialiser default parameters

### Phase 5: Persistence (Optional)

1. ✅ **NOUVEAU** `src/core/SettingsStorage.ts`
    - localStorage save/load
    - Schema versioning

2. ✅ [`src/main.ts`](src/main.ts) - Update
    - Ajouter `loadFilterParametersFromStorage()` au startup
    - Sauvegarder sur changement de paramètres

### Phase 6: Tests

1. ✅ **NOUVEAUX** `src/filters/__tests__/*.parameters.test.ts`
    - Test `setParameters()` pour chaque filtre
    - Validation, buffer preservation, cleanup

---

## 10. Risques & Points d'Attention

### 10.1 Risques Techniques

1. **Performance Degradation**
   - ⚠️ **Risque**: Changements de paramètres déclenchent reallocations
   - ✅ **Mitigation**: Tester avec Chrome DevTools Performance profiler
   - ✅ **Critère**: <16ms par frame (60 FPS) avec paramètres dynamiques

2. **Memory Leaks**
   - ⚠️ **Risque**: Buffers non libérés lors de cleanup()
   - ✅ **Mitigation**: Ajouter cleanup() aux filtres manquants
   - ✅ **Test**: Memory profiler après 1000 changements de paramètres

3. **State Corruption (Temporal Filters)**
   - ⚠️ **Risque**: Reset de `previousFrame` dans MotionDetection → faux positifs
   - ✅ **Mitigation**: Document clearly which params require state reset
   - ✅ **Test**: Changement de `MOTION_THRESHOLD` ne doit PAS reset previousFrame

### 10.2 Complexité UI

1. **Dynamic Slider Generation**
   - ⚠️ **Risque**: Event listeners non cleaned up → memory leak
   - ✅ **Mitigation**: `removeEventListener` avant regeneration
   - ✅ **Pattern**: Keep reference to listeners for cleanup

2. **Real-time Updates**
   - ⚠️ **Risque**: Trop d'updates pendant slider drag → lag
   - ✅ **Mitigation**: Throttle/debounce si nécessaire (tester d'abord)
   - ✅ **Alternative**: Update on "change" instead of "input"

### 10.3 Backward Compatibility

1. **No localStorage Migration Needed**
   - ✅ **Avantage**: Fresh start, pas de legacy code
   - ✅ **Opportunité**: Clean schema design from scratch

2. **Filter Interface Extension**
   - ✅ **Safe**: `setParameters()` est optionnel
   - ✅ **Filters sans paramètres** continuent de fonctionner sans modification

---

## 11. Fichiers Critiques - Résumé Visuel

```
src/
├── types/index.ts                    [#1] ✅ Ajouter FilterParameters interface
│
├── filters/
│   ├── Filter.ts                     [#2] ✅ Ajouter setParameters() optionnel
│   ├── VignetteFilter.ts             [#3] ⚙️ Implémenter (simple)
│   ├── BlurFilter.ts                 [#4] ⚙️ Implémenter (single buffer)
│   ├── DepthOfFieldFilter.ts         [#5] ⚙️ Implémenter + FIX cleanup()
│   ├── GlitchFilter.ts               [#6] ⚙️ Implémenter (temporal)
│   └── __tests__/
│       ├── BlurFilter.parameters.test.ts     [#12] 🧪 Tests nouveaux
│       └── VignetteFilter.parameters.test.ts [#12] 🧪 Tests nouveaux
│
├── ui/
│   └── SettingsOverlay.ts            [#7] 🎨 Ajouter sliders dynamiques
│
├── i18n/
│   └── translations.ts               [#8] 🌐 Ajouter labels paramètres
│
├── core/
│   └── SettingsStorage.ts            [#10] 💾 NOUVEAU (localStorage)
│
└── main.ts                           [#9] 🔗 Orchestration callbacks
```

**Légende**:

- ✅ Foundation (types/interfaces)
- ⚙️ Filter implementations
- 🎨 UI layer
- 🌐 Internationalization
- 💾 Persistence (optional)
- 🧪 Tests
- 🔗 Orchestration

---

## 12. Code Patterns Critiques à Réutiliser

### 12.1 Filter Parameter Getter Pattern (pour constantes dérivées)

**Problème**: `KERNEL_RADIUS` dépend de `KERNEL_SIZE`

**Solution actuelle**:

```typescript
private readonly KERNEL_SIZE = 5;
private readonly KERNEL_RADIUS = Math.floor(this.KERNEL_SIZE / 2);
```

**V6 pattern**:

```typescript
private kernelSize: number = 5;

private get kernelRadius(): number {
  return Math.floor(this.kernelSize / 2);
}

// Usage reste identique
for (let kx = -this.kernelRadius; kx <= this.kernelRadius; kx++) { ... }
```

### 12.2 Buffer Allocation Check Pattern

**Réutiliser** ([BlurFilter.ts](src/filters/BlurFilter.ts#L50-L53)):

```typescript
// Ensure temp buffer is allocated and sized correctly
const expectedLength = width * height * 4;
if (this.tempBuffer?.length !== expectedLength) {
  this.tempBuffer = new Uint8ClampedArray(expectedLength);
}
```

**NE PAS faire**:

```typescript
// ❌ BAD: Reallocate every frame
this.tempBuffer = new Uint8ClampedArray(width * height * 4);
```

### 12.3 Parameter Validation Pattern

**Nouveau pattern V6**:

```typescript
setParameters(params: FilterParameters): void {
  if (params.kernelSize !== undefined) {
    // Validate range
    const MIN = 3;
    const MAX = 15;
    const STEP = 2;
    
    // Clamp to valid range
    let value = Math.max(MIN, Math.min(MAX, params.kernelSize));
    
    // Enforce step (odd numbers only for kernel)
    value = Math.floor(value / STEP) * STEP + 1;
    
    if (value !== this.kernelSize) {
      this.kernelSize = value;
      // No buffer reallocation needed - dimensions unchanged
    }
  }
}
```

---

## Conclusion

**État de préparation pour V6**:

- ✅ **Architecture bien comprise** - Filters instantiated once, reused
- ✅ **Patterns identifiés** - 4 types de filtres (stateless, single-buffer, multi-buffer, temporal)
- ✅ **UI structure claire** - SettingsOverlay callback system ready to extend
- ✅ **Aucun localStorage legacy** - Clean slate pour persistence
- ✅ **Tests patterns établis** - Vitest, mocking ImageData, temporal state
- ⚠️ **Bugs identifiés** - DepthOfFieldFilter manque cleanup()

**Prochaines étapes**:

1. Commencer par [`src/types/index.ts`](src/types/index.ts) - Définir interfaces
2. Implémenter VignetteFilter (simple) comme POC
3. Valider performance avec Chrome DevTools
4. Étendre aux autres filtres progressivement
5. Ajouter localStorage en Phase 5 (optionnel)

**Estimation effort**:

- Phase 1-2 (Foundations + 1 filtre): **4-6 heures**
- Phase 3 (4 filtres): **8-10 heures**
- Phase 4 (UI): **6-8 heures**
- Phase 5 (Orchestration): **4 heures**
- Phase 6 (Persistence): **6 heures** (optional)
- Phase 7 (Tests): **8-10 heures**

**Total**: **36-44 heures** (5-6 jours de développement)

---

**Rapport généré le**: 2026-01-23  
**Fichiers analysés**: 15 fichiers core + 5 filtres représentatifs  
**Lignes de code analysées**: ~3000 lignes
