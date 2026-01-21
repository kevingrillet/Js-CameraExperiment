/**
 * Shared TypeScript types for the video filter application
 */

export type FilterType =
  | "none"
  | "invert"
  | "motion"
  | "pixelate"
  | "crt"
  | "rotoscope"
  | "edge"
  | "nightvision"
  | "vhs";

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
  { type: "invert" },
  { type: "motion" },
  { type: "pixelate" },
  { type: "crt" },
  { type: "rotoscope" },
  { type: "edge" },
  { type: "nightvision" },
  { type: "vhs" },
];
