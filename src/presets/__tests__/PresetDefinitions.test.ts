/**
 * PresetDefinitions tests
 * V6 - Validate all 5 presets against constraints
 */

import { describe, it, expect } from "vitest";
import {
  PRESETS,
  validatePreset,
  getPresetNames,
  getPreset,
} from "../PresetDefinitions";
import type { PresetFilterConfig } from "../PresetDefinitions";

describe("PresetDefinitions", () => {
  it("should have exactly 5 presets", () => {
    const presetKeys = Object.keys(PRESETS);
    expect(presetKeys).toHaveLength(5);
    expect(presetKeys).toContain("cinematic");
    expect(presetKeys).toContain("vintageFilm");
    expect(presetKeys).toContain("cyberpunk");
    expect(presetKeys).toContain("surveillance");
    expect(presetKeys).toContain("dreamSequence");
  });

  describe("Preset validation", () => {
    it("should validate Cinematic preset", () => {
      const preset = PRESETS["cinematic"];
      expect(preset).toBeDefined();
      if (preset === undefined) {
        return;
      }
      expect(validatePreset(preset)).toBe(true);
      expect(preset.filters).toHaveLength(2);
      expect(preset.filters[0]?.type).toBe("dof");
      expect(preset.filters[1]?.type).toBe("vignette");
    });

    it("should validate Vintage Film preset", () => {
      const preset = PRESETS["vintageFilm"];
      expect(preset).toBeDefined();
      if (preset === undefined) {
        return;
      }
      expect(validatePreset(preset)).toBe(true);
      expect(preset.filters).toHaveLength(3);
    });

    it("should validate Cyberpunk preset", () => {
      const preset = PRESETS["cyberpunk"];
      expect(preset).toBeDefined();
      if (preset === undefined) {
        return;
      }
      expect(validatePreset(preset)).toBe(true);
      expect(preset.filters).toHaveLength(3);
    });

    it("should validate Surveillance preset", () => {
      const preset = PRESETS["surveillance"];
      expect(preset).toBeDefined();
      if (preset === undefined) {
        return;
      }
      expect(validatePreset(preset)).toBe(true);
      expect(preset.filters).toHaveLength(3);
    });

    it("should validate Dream Sequence preset", () => {
      const preset = PRESETS["dreamSequence"];
      expect(preset).toBeDefined();
      if (preset === undefined) {
        return;
      }
      expect(validatePreset(preset)).toBe(true);
      expect(preset.filters).toHaveLength(3);
    });
  });

  describe("Constraint validation", () => {
    it("should detect duplicate FilterTypes", () => {
      const invalidPreset = {
        name: "Invalid",
        filters: [
          { type: "blur" as const, params: { kernelSize: 5 } },
          { type: "vignette" as const, params: { strength: 0.6 } },
          { type: "blur" as const, params: { kernelSize: 9 } }, // Duplicate!
        ],
      };

      expect(validatePreset(invalidPreset)).toBe(false);
    });

    it("should detect stack length > 5", () => {
      const invalidPreset = {
        name: "TooMany",
        filters: [
          { type: "blur" as const, params: {} },
          { type: "vignette" as const, params: {} },
          { type: "sepia" as const, params: {} },
          { type: "edge" as const, params: {} },
          { type: "crt" as const, params: {} },
          { type: "glitch" as const, params: {} }, // 6th filter!
        ],
      };

      expect(validatePreset(invalidPreset)).toBe(false);
    });

    it("should accept valid preset with 1 filter", () => {
      const validPreset = {
        name: "SingleFilter",
        filters: [{ type: "blur" as const, params: { kernelSize: 5 } }],
      };

      expect(validatePreset(validPreset)).toBe(true);
    });

    it("should accept empty params", () => {
      const validPreset = {
        name: "NoParams",
        filters: [
          { type: "sepia" as const, params: {} },
          { type: "invert" as const, params: {} },
        ],
      };

      expect(validatePreset(validPreset)).toBe(true);
    });
  });

  describe("Preset parameter values", () => {
    it("Cinematic should have correct DoF params", () => {
      const preset = PRESETS["cinematic"];
      expect(preset).toBeDefined();
      if (preset === undefined) {
        return;
      }
      const dof = preset.filters.find((f) => f.type === "dof");

      expect(dof?.params?.["focusRadius"]).toBe(0.25);
      expect(dof?.params?.["blurStrength"]).toBe(11);
    });

    it("Dream Sequence should have kernelSize=9", () => {
      const preset = PRESETS["dreamSequence"];
      expect(preset).toBeDefined();
      if (preset === undefined) {
        return;
      }
      const blur = preset.filters.find((f) => f.type === "blur");

      expect(blur?.params?.["kernelSize"]).toBe(9);
    });

    it("Cyberpunk should have high glitch intensity", () => {
      const preset = PRESETS["cyberpunk"];
      expect(preset).toBeDefined();
      if (preset === undefined) {
        return;
      }
      const glitch = preset.filters.find((f) => f.type === "glitch");

      expect(glitch?.params?.["rgbGlitchIntensity"]).toBe(12);
    });
  });

  // --- getPresetNames ---

  describe("getPresetNames", () => {
    it("should return all preset keys", () => {
      const names = getPresetNames();
      expect(names).toHaveLength(5);
      expect(names).toContain("cinematic");
      expect(names).toContain("vintageFilm");
      expect(names).toContain("cyberpunk");
      expect(names).toContain("surveillance");
      expect(names).toContain("dreamSequence");
    });
  });

  // --- getPreset ---

  describe("getPreset", () => {
    it("should return a preset by name", () => {
      const preset = getPreset("cinematic");
      expect(preset).toBeDefined();
      expect(preset?.name).toBeTruthy();
      expect(preset?.filters.length).toBeGreaterThan(0);
    });

    it("should return undefined for unknown preset", () => {
      const preset = getPreset("nonexistent");
      expect(preset).toBeUndefined();
    });
  });

  // --- Edge cases ---

  describe("Edge cases", () => {
    it("should reject preset with empty filters array", () => {
      const emptyPreset = {
        name: "Empty",
        filters: [] as PresetFilterConfig[],
      };
      // Empty filters should fail - no useful preset
      expect(validatePreset(emptyPreset)).toBe(false);
    });
  });
});
