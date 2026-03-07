/**
 * Shared TypeScript types for the video filter application
 */

export type FilterType =
  | "none"
  | "blur"
  | "bw"
  | "chromatic"
  | "comicbook"
  | "dof"
  | "invert"
  | "kaleidoscope"
  | "motion"
  | "pixelate"
  | "crt"
  | "rotoscope"
  | "edge"
  | "nightvision"
  | "sepia"
  | "thermal"
  | "vhs"
  | "vignette"
  | "ascii"
  | "glitch"
  | "oilpainting"
  | "sobelrainbow";

export type SourceType = "webcam" | "image";

export type AspectRatioMode =
  | "contain" // Letterbox with black bars
  | "cover"; // Crop to fill

export interface AppConfig {
  sourceType: SourceType;
  selectedDeviceId?: string;
  filterType: FilterType;
  aspectRatioMode: AspectRatioMode;
  showFPS: boolean;
}

export interface FilterMetadata {
  type: FilterType;
}

export const AVAILABLE_FILTERS: FilterMetadata[] = [
  { type: "none" },
  { type: "ascii" },
  { type: "blur" },
  { type: "bw" },
  { type: "chromatic" },
  { type: "comicbook" },
  { type: "crt" },
  { type: "dof" },
  { type: "edge" },
  { type: "glitch" },
  { type: "invert" },
  { type: "kaleidoscope" },
  { type: "motion" },
  { type: "nightvision" },
  { type: "oilpainting" },
  { type: "pixelate" },
  { type: "rotoscope" },
  { type: "sepia" },
  { type: "sobelrainbow" },
  { type: "thermal" },
  { type: "vhs" },
  { type: "vignette" },
];

/**
 * V6 - Filter Parameters Type System
 * Discriminated union for type-safe filter parameters
 */

// Simple filters (11 filters, 17 params)
export interface AsciiFilterParams {
  type: "ascii";
  characterSize: number; // 4-16, default 8
}

export interface BlurFilterParams {
  type: "blur";
  kernelSize: number; // 3-15, default 5
}

export interface BlackWhiteFilterParams {
  type: "bw";
  thresholdMode: number; // 0=amount | 1=random | 2=bluerandom, default 0
  threshold: number; // 0–255, default 128
  ditheringMode: number; // 0=none | 1=bayer2 | 2=bayer4 | 3=bayer8 | 4=bayer16, default 0
}

export interface ChromaticAberrationFilterParams {
  type: "chromatic";
  offset: number; // 1-10, default 3
}

export interface ComicBookFilterParams {
  type: "comicbook";
  edgeSensitivity: number; // 30-200, default 100
}

export interface EdgeDetectionFilterParams {
  type: "edge";
  edgeSensitivity: number; // 10-150, default 50
}

export interface KaleidoscopeFilterParams {
  type: "kaleidoscope";
  segments: number; // 3-12, default 6
  autoRotateEnabled: number; // 0 or 1 (boolean as number for slider)
  rotationSpeed: number; // 0.1-5.0 degrees/frame, default 0.5
}

export interface SobelRainbowFilterParams {
  type: "sobelrainbow";
  edgeSensitivity: number; // 10-150, default 50
}

export interface VignetteFilterParams {
  type: "vignette";
  strength: number; // 0.0-1.0, default 0.6
}

export interface DepthOfFieldFilterParams {
  type: "dof";
  focusRadius: number; // 0.1-0.6, default 0.3
  blurStrength: number; // 3-15, default 9
}

export interface NightVisionFilterParams {
  type: "nightvision";
  grainIntensity: number; // 0.0-0.5, default 0.12
  vignetteStrength: number; // 0.0-1.0, default 0.4
}

export interface PixelateFilterParams {
  type: "pixelate";
  horizontalResolution: number; // 80-320, default 160
  verticalResolution: number; // 72-288, default 144
}

// Complex filters (6 filters, 22 params)
export interface CRTFilterParams {
  type: "crt";
  scanlineDarkness: number; // 0.0-1.0, default 0.3
  scanlineSpacing: number; // 1-6, default 2
  bloomIntensity: number; // 0.0-0.5, default 0.15
}

export interface MotionDetectionFilterParams {
  type: "motion";
  sensitivity: number; // 10-100, default 30
  noiseFilter: number; // 0-10, default 3
  trailDuration: number; // 0.5-0.98, default 0.85
}

export interface OilPaintingFilterParams {
  type: "oilpainting";
  colorLevels: number; // 4-16, default 8
  brushSize: number; // 3-9, default 5
  edgePreservation: number; // 30-150, default 80
}

export interface RotoscopeFilterParams {
  type: "rotoscope";
  colorLevels: number; // 3-12, default 6
  edgeSensitivity: number; // 10-100, default 30
  edgeDarkness: number; // 0.0-1.0, default 0.8
}

export interface VHSFilterParams {
  type: "vhs";
  glitchFrequency: number; // 0.0-0.1, default 0.02
  trackingLinesFrequency: number; // 0.0-0.5, default 0.15
  grainIntensity: number; // 0.0-0.3, default 0.08
}

export interface GlitchFilterParams {
  type: "glitch";
  lineShiftFrequency: number; // 0.0-0.3, default 0.05
  rgbGlitchFrequency: number; // 0.0-0.5, default 0.15
  rgbGlitchIntensity: number; // 3-20, default 8
  blockCorruptionFrequency: number; // 0.0-0.2, default 0.05
  glitchMinDuration: number; // 1-5 frames, default 2
  glitchMaxDuration: number; // 2-10 frames, default 5
}

// Discriminated union of all filter parameters
export type FilterParameters =
  | AsciiFilterParams
  | BlurFilterParams
  | ChromaticAberrationFilterParams
  | ComicBookFilterParams
  | EdgeDetectionFilterParams
  | KaleidoscopeFilterParams
  | SobelRainbowFilterParams
  | VignetteFilterParams
  | DepthOfFieldFilterParams
  | NightVisionFilterParams
  | PixelateFilterParams
  | CRTFilterParams
  | MotionDetectionFilterParams
  | OilPaintingFilterParams
  | RotoscopeFilterParams
  | VHSFilterParams
  | GlitchFilterParams
  | BlackWhiteFilterParams;

// Mapping FilterType to its parameter interface
export type FilterParametersMap = {
  ascii: AsciiFilterParams;
  blur: BlurFilterParams;
  chromatic: ChromaticAberrationFilterParams;
  comicbook: ComicBookFilterParams;
  edge: EdgeDetectionFilterParams;
  kaleidoscope: KaleidoscopeFilterParams;
  sobelrainbow: SobelRainbowFilterParams;
  vignette: VignetteFilterParams;
  dof: DepthOfFieldFilterParams;
  nightvision: NightVisionFilterParams;
  pixelate: PixelateFilterParams;
  crt: CRTFilterParams;
  motion: MotionDetectionFilterParams;
  oilpainting: OilPaintingFilterParams;
  rotoscope: RotoscopeFilterParams;
  vhs: VHSFilterParams;
  glitch: GlitchFilterParams;
  bw: BlackWhiteFilterParams;
  // Filters without parameters (not in map)
  // none, invert, sepia, thermal
};

/**
 * Parameter definitions with min/max/step/default for UI generation
 */
export const FILTER_PARAM_DEFS = {
  ascii: {
    characterSize: { min: 4, max: 16, step: 1, default: 8 },
  },
  blur: {
    kernelSize: { min: 3, max: 15, step: 1, default: 5 },
  },
  chromatic: {
    offset: { min: 1, max: 10, step: 1, default: 3 },
  },
  comicbook: {
    edgeSensitivity: { min: 30, max: 200, step: 10, default: 100 },
  },
  edge: {
    edgeSensitivity: { min: 10, max: 150, step: 10, default: 50 },
  },
  kaleidoscope: {
    segments: { min: 3, max: 12, step: 1, default: 6 },
    autoRotateEnabled: { min: 0, max: 1, step: 1, default: 0 }, // Toggle: 0 = off, 1 = on
    rotationSpeed: { min: 0.1, max: 5.0, step: 0.1, default: 0.5 },
  },
  sobelrainbow: {
    edgeSensitivity: { min: 10, max: 150, step: 10, default: 50 },
  },
  vignette: {
    strength: { min: 0, max: 1, step: 0.05, default: 0.6 },
  },
  dof: {
    focusRadius: { min: 0.1, max: 0.6, step: 0.05, default: 0.3 },
    blurStrength: { min: 3, max: 15, step: 1, default: 9 },
  },
  nightvision: {
    grainIntensity: { min: 0, max: 0.5, step: 0.05, default: 0.12 },
    vignetteStrength: { min: 0, max: 1, step: 0.05, default: 0.4 },
  },
  pixelate: {
    horizontalResolution: { min: 80, max: 320, step: 10, default: 160 },
    verticalResolution: { min: 72, max: 288, step: 12, default: 144 },
  },
  crt: {
    scanlineDarkness: { min: 0, max: 1, step: 0.05, default: 0.3 },
    scanlineSpacing: { min: 1, max: 6, step: 1, default: 2 },
    bloomIntensity: { min: 0, max: 0.5, step: 0.05, default: 0.15 },
  },
  motion: {
    sensitivity: { min: 10, max: 100, step: 5, default: 30 },
    noiseFilter: { min: 0, max: 10, step: 1, default: 3 },
    trailDuration: { min: 0.5, max: 0.98, step: 0.05, default: 0.85 },
  },
  oilpainting: {
    colorLevels: { min: 4, max: 16, step: 1, default: 8 },
    brushSize: { min: 3, max: 9, step: 1, default: 5 },
    edgePreservation: { min: 30, max: 150, step: 10, default: 80 },
  },
  rotoscope: {
    colorLevels: { min: 3, max: 12, step: 1, default: 6 },
    edgeSensitivity: { min: 10, max: 100, step: 10, default: 30 },
    edgeDarkness: { min: 0, max: 1, step: 0.05, default: 0.8 },
  },
  vhs: {
    glitchFrequency: { min: 0, max: 0.1, step: 0.01, default: 0.02 },
    trackingLinesFrequency: { min: 0, max: 0.5, step: 0.05, default: 0.15 },
    grainIntensity: { min: 0, max: 0.3, step: 0.05, default: 0.08 },
  },
  glitch: {
    lineShiftFrequency: { min: 0, max: 0.3, step: 0.05, default: 0.05 },
    rgbGlitchFrequency: { min: 0, max: 0.5, step: 0.05, default: 0.15 },
    rgbGlitchIntensity: { min: 3, max: 20, step: 1, default: 8 },
    blockCorruptionFrequency: { min: 0, max: 0.2, step: 0.05, default: 0.05 },
    glitchMinDuration: { min: 1, max: 5, step: 1, default: 2 },
    glitchMaxDuration: { min: 2, max: 10, step: 1, default: 5 },
  },
  bw: {
    thresholdMode: { min: 0, max: 2, step: 1, default: 0 },
    threshold: { min: 0, max: 255, step: 1, default: 128 },
    ditheringMode: { min: 0, max: 4, step: 1, default: 0 },
  },
} as const;

/**
 * LocalStorage settings schema (V6)
 */
export interface StoredSettings {
  version: number; // 6
  language?: "fr" | "en";
  filterParams: Partial<Record<FilterType, Partial<FilterParameters>>>;
  filterStack: FilterType[];
  webglEnabled: boolean;
  smoothTransitionsEnabled: boolean;
  kaleidoscopeAutoRotate: {
    enabled: boolean;
    speed: number; // degrees per frame
  };
}
