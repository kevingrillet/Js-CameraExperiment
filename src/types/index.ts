/**
 * Shared TypeScript types for the video filter application
 */

export type FilterType =
  | "none"
  | "invert"
  | "motion"
  | "pixelate"
  | "crt"
  | "rotoscope";

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
  name: string;
  type: FilterType;
  description: string;
}

export const AVAILABLE_FILTERS: FilterMetadata[] = [
  { name: "Aucun", type: "none", description: "Pas de filtre" },
  { name: "Inversé", type: "invert", description: "Couleurs inversées" },
  {
    name: "Détection de mouvement",
    type: "motion",
    description: "Heatmap de mouvement",
  },
  {
    name: "Pixelisé (Game Boy)",
    type: "pixelate",
    description: "Style rétro pixelisé",
  },
  { name: "CRT", type: "crt", description: "Effet écran cathodique" },
  {
    name: "Rotoscopie",
    type: "rotoscope",
    description: "Effet cartoon/dessin animé",
  },
];
