/**
 * PresetDefinitions - V6 predefined filter stack presets
 *
 * Each preset defines:
 * - A complete filter stack (1-5 filters, sequential application)
 * - All parameters for each filter (validated against filter defaults)
 *
 * Constraints:
 * - Each FilterType appears at most ONCE in a preset (no duplicate types)
 * - Stack length <= 5
 * - All parameters within valid ranges (defined in FILTER_PARAM_DEFS)
 */

import type { FilterType } from "../types";

export interface PresetFilterConfig {
  type: FilterType;
  params: Record<string, number>;
}

export interface PresetConfig {
  name: string;
  filters: PresetFilterConfig[];
}

/**
 * V6 Predefined Presets (5 total)
 * Source: tech-spec-v6 scope section
 */
export const PRESETS: Record<string, PresetConfig> = {
  cinematic: {
    name: "Cinematic",
    filters: [
      {
        type: "dof",
        params: {
          focusRadius: 0.25,
          blurStrength: 11,
        },
      },
      {
        type: "vignette",
        params: {
          strength: 0.7,
        },
      },
    ],
  },

  vintageFilm: {
    name: "Vintage Film",
    filters: [
      {
        type: "sepia",
        params: {},
      },
      {
        type: "vignette",
        params: {
          strength: 0.5,
        },
      },
      {
        type: "vhs",
        params: {
          glitchFrequency: 0.03,
          grainIntensity: 0.12,
        },
      },
    ],
  },

  cyberpunk: {
    name: "Cyberpunk",
    filters: [
      {
        type: "glitch",
        params: {
          lineShiftFrequency: 0.15,
          rgbGlitchFrequency: 0.3,
          rgbGlitchIntensity: 12,
          blockCorruptionFrequency: 0.1,
          glitchMinDuration: 2,
          glitchMaxDuration: 8,
        },
      },
      {
        type: "chromatic",
        params: {
          offset: 7,
        },
      },
      {
        type: "crt",
        params: {
          scanlineDarkness: 0.4,
          scanlineSpacing: 2,
          bloomIntensity: 0.15,
        },
      },
    ],
  },

  surveillance: {
    name: "Surveillance",
    filters: [
      {
        type: "thermal",
        params: {},
      },
      {
        type: "edge",
        params: {
          edgeSensitivity: 80,
        },
      },
      {
        type: "nightvision",
        params: {
          grainIntensity: 0.2,
        },
      },
    ],
  },

  dreamSequence: {
    name: "Dream Sequence",
    filters: [
      {
        type: "blur",
        params: {
          kernelSize: 9, // 9px blur as per spec
        },
      },
      {
        type: "vignette",
        params: {
          strength: 0.8,
        },
      },
      {
        type: "chromatic",
        params: {
          offset: 4, // 4px offset as per spec
        },
      },
    ],
  },
};

/**
 * Validate a preset configuration
 *
 * F12 FIX - Ensures:
 * - No duplicate FilterTypes in stack
 * - Stack length <= 5
 * - All FilterTypes exist (will be validated at runtime when filters Map is available)
 *
 * @param preset - The preset configuration to validate
 * @returns True if valid, false otherwise
 */
export function validatePreset(preset: PresetConfig): boolean {
  // Check stack length
  if (preset.filters.length === 0 || preset.filters.length > 5) {
    return false;
  }

  // Check for duplicate FilterTypes
  const seenTypes = new Set<FilterType>();
  for (const filter of preset.filters) {
    if (seenTypes.has(filter.type)) {
      return false; // Duplicate type found
    }
    seenTypes.add(filter.type);
  }

  // All checks passed
  return true;
}

/**
 * Get all preset names
 * @returns Array of preset keys
 */
export function getPresetNames(): string[] {
  return Object.keys(PRESETS);
}

/**
 * Get a preset by name
 * @param name - Preset key
 * @returns Preset configuration or undefined
 */
export function getPreset(name: string): PresetConfig | undefined {
  return PRESETS[name];
}
