/**
 * Shared TypeScript types for the video filter application
 */

export type FilterType =
  | "none"
  | "blur"
  | "chromatic"
  | "invert"
  | "motion"
  | "pixelate"
  | "crt"
  | "rotoscope"
  | "edge"
  | "nightvision"
  | "sepia"
  | "thermal"
  | "vhs"
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
  { type: "chromatic" },
  { type: "crt" },
  { type: "edge" },
  { type: "glitch" },
  { type: "invert" },
  { type: "motion" },
  { type: "nightvision" },
  { type: "oilpainting" },
  { type: "pixelate" },
  { type: "rotoscope" },
  { type: "sepia" },
  { type: "sobelrainbow" },
  { type: "thermal" },
  { type: "vhs" },
];
