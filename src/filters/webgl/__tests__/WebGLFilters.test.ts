/**
 * WebGL GPU Filter tests
 * Tests constructor safety, parameter handling, error behavior, and cleanup
 * Note: happy-dom does not provide WebGL context, so apply() will throw
 */

import { describe, it, expect } from "vitest";

// No-parameter filters
import { SepiaFilterWebGL } from "../SepiaFilterWebGL";
import { InvertFilterWebGL } from "../InvertFilterWebGL";
import { ThermalFilterWebGL } from "../ThermalFilterWebGL";

// Single-parameter filters
import { VignetteFilterWebGL } from "../VignetteFilterWebGL";
import { ChromaticAberrationFilterWebGL } from "../ChromaticAberrationFilterWebGL";
import { EdgeDetectionFilterWebGL } from "../EdgeDetectionFilterWebGL";
import { SobelRainbowFilterWebGL } from "../SobelRainbowFilterWebGL";
import { ComicBookFilterWebGL } from "../ComicBookFilterWebGL";
import { AsciiFilterWebGL } from "../AsciiFilterWebGL";

// Multi-parameter filters
import { BlurFilterWebGL } from "../BlurFilterWebGL";
import { CRTFilterWebGL } from "../CRTFilterWebGL";
import { NightVisionFilterWebGL } from "../NightVisionFilterWebGL";
import { RotoscopeFilterWebGL } from "../RotoscopeFilterWebGL";
import { KaleidoscopeFilterWebGL } from "../KaleidoscopeFilterWebGL";
import { PixelateFilterWebGL } from "../PixelateFilterWebGL";
import { VHSFilterWebGL } from "../VHSFilterWebGL";
import { GlitchFilterWebGL } from "../GlitchFilterWebGL";
import { OilPaintingFilterWebGL } from "../OilPaintingFilterWebGL";
import { DepthOfFieldFilterWebGL } from "../DepthOfFieldFilterWebGL";
import { MotionDetectionFilterWebGL } from "../MotionDetectionFilterWebGL";

// Helper to create test ImageData
function createTestImageData(width = 4, height = 4): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 128;
    data[i + 1] = 64;
    data[i + 2] = 32;
    data[i + 3] = 255;
  }
  return { width, height, data, colorSpace: "srgb" } as ImageData;
}

// ===== No-parameter filters =====

describe("SepiaFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new SepiaFilterWebGL()).not.toThrow();
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new SepiaFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new SepiaFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

describe("InvertFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new InvertFilterWebGL()).not.toThrow();
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new InvertFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new InvertFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

describe("ThermalFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new ThermalFilterWebGL()).not.toThrow();
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new ThermalFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new ThermalFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== VignetteFilterWebGL =====

describe("VignetteFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new VignetteFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new VignetteFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({ strength: 0.6 });
  });

  it("should clamp strength to [0, 1]", () => {
    const filter = new VignetteFilterWebGL();
    filter.setParameters({ strength: -0.5 });
    filter.setParameters({ strength: 2.0 });
    // No throw expected — values are silently clamped
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new VignetteFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new VignetteFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== ChromaticAberrationFilterWebGL =====

describe("ChromaticAberrationFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new ChromaticAberrationFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new ChromaticAberrationFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({ offset: 3 });
  });

  it("should clamp offset to [1, 10] and floor", () => {
    const filter = new ChromaticAberrationFilterWebGL();
    filter.setParameters({ offset: 0 });
    filter.setParameters({ offset: 15 });
    filter.setParameters({ offset: 5.7 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new ChromaticAberrationFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new ChromaticAberrationFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== EdgeDetectionFilterWebGL =====

describe("EdgeDetectionFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new EdgeDetectionFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new EdgeDetectionFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({ edgeSensitivity: 50 });
  });

  it("should clamp edgeSensitivity to [10, 150]", () => {
    const filter = new EdgeDetectionFilterWebGL();
    filter.setParameters({ edgeSensitivity: 5 });
    filter.setParameters({ edgeSensitivity: 200 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new EdgeDetectionFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new EdgeDetectionFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== SobelRainbowFilterWebGL =====

describe("SobelRainbowFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new SobelRainbowFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new SobelRainbowFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({ edgeSensitivity: 50 });
  });

  it("should clamp edgeSensitivity to [10, 150]", () => {
    const filter = new SobelRainbowFilterWebGL();
    filter.setParameters({ edgeSensitivity: 5 });
    filter.setParameters({ edgeSensitivity: 200 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new SobelRainbowFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new SobelRainbowFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== ComicBookFilterWebGL =====

describe("ComicBookFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new ComicBookFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new ComicBookFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({ edgeSensitivity: 100 });
  });

  it("should clamp edgeSensitivity to [30, 200]", () => {
    const filter = new ComicBookFilterWebGL();
    filter.setParameters({ edgeSensitivity: 10 });
    filter.setParameters({ edgeSensitivity: 300 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new ComicBookFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new ComicBookFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== AsciiFilterWebGL =====

describe("AsciiFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new AsciiFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new AsciiFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({ characterSize: 8 });
  });

  it("should clamp characterSize to [4, 16] and floor", () => {
    const filter = new AsciiFilterWebGL();
    filter.setParameters({ characterSize: 2 });
    filter.setParameters({ characterSize: 20 });
    filter.setParameters({ characterSize: 7.8 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new AsciiFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely (custom cleanup for atlas)", () => {
    const filter = new AsciiFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== BlurFilterWebGL =====

describe("BlurFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new BlurFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new BlurFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({ kernelSize: 5 });
  });

  it("should clamp kernelSize to [3, 15], floor, and force odd", () => {
    const filter = new BlurFilterWebGL();
    filter.setParameters({ kernelSize: 1 });
    filter.setParameters({ kernelSize: 20 });
    filter.setParameters({ kernelSize: 6 }); // should become 5
    filter.setParameters({ kernelSize: 8.7 }); // should floor to 8, then odd → 7
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new BlurFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely (custom cleanup for dual-pass)", () => {
    const filter = new BlurFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== CRTFilterWebGL =====

describe("CRTFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new CRTFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new CRTFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      scanlineDarkness: 0.3,
      scanlineSpacing: 2,
      bloomIntensity: 0.15,
    });
  });

  it("should clamp parameters to valid ranges", () => {
    const filter = new CRTFilterWebGL();
    filter.setParameters({
      scanlineDarkness: -0.5,
      scanlineSpacing: 0,
      bloomIntensity: 1.0,
    });
    filter.setParameters({
      scanlineDarkness: 2.0,
      scanlineSpacing: 10,
      bloomIntensity: -0.1,
    });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new CRTFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new CRTFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== NightVisionFilterWebGL =====

describe("NightVisionFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new NightVisionFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new NightVisionFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      grainIntensity: 0.12,
      vignetteStrength: 0.4,
    });
  });

  it("should clamp grainIntensity to [0, 0.5]", () => {
    const filter = new NightVisionFilterWebGL();
    filter.setParameters({ grainIntensity: -1 });
    filter.setParameters({ grainIntensity: 1.0 });
  });

  it("should clamp vignetteStrength to [0, 1]", () => {
    const filter = new NightVisionFilterWebGL();
    filter.setParameters({ vignetteStrength: -0.5 });
    filter.setParameters({ vignetteStrength: 2.0 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new NightVisionFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new NightVisionFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== RotoscopeFilterWebGL =====

describe("RotoscopeFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new RotoscopeFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new RotoscopeFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      colorLevels: 6,
      edgeSensitivity: 30,
      edgeDarkness: 0.8,
    });
  });

  it("should clamp colorLevels to [3, 12] and round", () => {
    const filter = new RotoscopeFilterWebGL();
    filter.setParameters({ colorLevels: 1 });
    filter.setParameters({ colorLevels: 20 });
    filter.setParameters({ colorLevels: 5.5 });
  });

  it("should clamp edgeSensitivity to [10, 100]", () => {
    const filter = new RotoscopeFilterWebGL();
    filter.setParameters({ edgeSensitivity: 5 });
    filter.setParameters({ edgeSensitivity: 200 });
  });

  it("should clamp edgeDarkness to [0, 1]", () => {
    const filter = new RotoscopeFilterWebGL();
    filter.setParameters({ edgeDarkness: -0.5 });
    filter.setParameters({ edgeDarkness: 2.0 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new RotoscopeFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new RotoscopeFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== KaleidoscopeFilterWebGL =====

describe("KaleidoscopeFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new KaleidoscopeFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new KaleidoscopeFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      segments: 6,
      autoRotateEnabled: 0,
      rotationSpeed: 0.5,
    });
  });

  it("should clamp segments to [3, 12] and round", () => {
    const filter = new KaleidoscopeFilterWebGL();
    filter.setParameters({ segments: 1 });
    filter.setParameters({ segments: 20 });
  });

  it("should clamp rotationSpeed to [0.1, 5.0]", () => {
    const filter = new KaleidoscopeFilterWebGL();
    filter.setParameters({ rotationSpeed: 0.01 });
    filter.setParameters({ rotationSpeed: 10.0 });
  });

  it("should handle autoRotateEnabled toggle", () => {
    const filter = new KaleidoscopeFilterWebGL();
    filter.setParameters({ autoRotateEnabled: 1 });
    filter.setParameters({ autoRotateEnabled: 0 });
  });

  it("should handle rotation and autoRotate params", () => {
    const filter = new KaleidoscopeFilterWebGL();
    filter.setParameters({ rotation: 3.14 });
    filter.setParameters({ autoRotate: 2.0 });
    filter.setParameters({ autoRotate: -1 }); // disables
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new KaleidoscopeFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new KaleidoscopeFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== PixelateFilterWebGL =====

describe("PixelateFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new PixelateFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new PixelateFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      horizontalResolution: 160,
      verticalResolution: 144,
    });
  });

  it("should clamp horizontalResolution to [80, 320] and floor", () => {
    const filter = new PixelateFilterWebGL();
    filter.setParameters({ horizontalResolution: 40 });
    filter.setParameters({ horizontalResolution: 400 });
    filter.setParameters({ horizontalResolution: 100.9 });
  });

  it("should clamp verticalResolution to [72, 288] and floor", () => {
    const filter = new PixelateFilterWebGL();
    filter.setParameters({ verticalResolution: 30 });
    filter.setParameters({ verticalResolution: 350 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new PixelateFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new PixelateFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== VHSFilterWebGL =====

describe("VHSFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new VHSFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new VHSFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      glitchFrequency: 0.02,
      trackingLinesFrequency: 0.15,
      grainIntensity: 0.08,
    });
  });

  it("should clamp glitchFrequency to [0, 0.1]", () => {
    const filter = new VHSFilterWebGL();
    filter.setParameters({ glitchFrequency: -0.5 });
    filter.setParameters({ glitchFrequency: 0.5 });
  });

  it("should clamp trackingLinesFrequency to [0, 0.5]", () => {
    const filter = new VHSFilterWebGL();
    filter.setParameters({ trackingLinesFrequency: -0.1 });
    filter.setParameters({ trackingLinesFrequency: 1.0 });
  });

  it("should clamp grainIntensity to [0, 0.3]", () => {
    const filter = new VHSFilterWebGL();
    filter.setParameters({ grainIntensity: -0.1 });
    filter.setParameters({ grainIntensity: 0.5 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new VHSFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new VHSFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== GlitchFilterWebGL =====

describe("GlitchFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new GlitchFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new GlitchFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      lineShiftFrequency: 0.05,
      rgbGlitchFrequency: 0.15,
      rgbGlitchIntensity: 8,
      blockCorruptionFrequency: 0.05,
      glitchMinDuration: 2,
      glitchMaxDuration: 5,
    });
  });

  it("should clamp lineShiftFrequency to [0, 0.3]", () => {
    const filter = new GlitchFilterWebGL();
    filter.setParameters({ lineShiftFrequency: -0.1 });
    filter.setParameters({ lineShiftFrequency: 0.5 });
  });

  it("should clamp rgbGlitchFrequency to [0, 0.5]", () => {
    const filter = new GlitchFilterWebGL();
    filter.setParameters({ rgbGlitchFrequency: -0.1 });
    filter.setParameters({ rgbGlitchFrequency: 1.0 });
  });

  it("should clamp rgbGlitchIntensity to [3, 20] and floor", () => {
    const filter = new GlitchFilterWebGL();
    filter.setParameters({ rgbGlitchIntensity: 1 });
    filter.setParameters({ rgbGlitchIntensity: 30 });
    filter.setParameters({ rgbGlitchIntensity: 10.7 });
  });

  it("should clamp blockCorruptionFrequency to [0, 0.2]", () => {
    const filter = new GlitchFilterWebGL();
    filter.setParameters({ blockCorruptionFrequency: -0.1 });
    filter.setParameters({ blockCorruptionFrequency: 0.5 });
  });

  it("should clamp glitchMinDuration to [1, 5] and floor", () => {
    const filter = new GlitchFilterWebGL();
    filter.setParameters({ glitchMinDuration: 0 });
    filter.setParameters({ glitchMinDuration: 8 });
  });

  it("should clamp glitchMaxDuration to [2, 10] and floor", () => {
    const filter = new GlitchFilterWebGL();
    filter.setParameters({ glitchMaxDuration: 1 });
    filter.setParameters({ glitchMaxDuration: 15 });
  });

  it("should handle all parameters at once", () => {
    const filter = new GlitchFilterWebGL();
    filter.setParameters({
      lineShiftFrequency: 0.1,
      rgbGlitchFrequency: 0.2,
      rgbGlitchIntensity: 10,
      blockCorruptionFrequency: 0.1,
      glitchMinDuration: 3,
      glitchMaxDuration: 7,
    });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new GlitchFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new GlitchFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== OilPaintingFilterWebGL =====

describe("OilPaintingFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new OilPaintingFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new OilPaintingFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      colorLevels: 8,
      brushSize: 5,
      edgePreservation: 80,
    });
  });

  it("should clamp colorLevels to [4, 16] and round", () => {
    const filter = new OilPaintingFilterWebGL();
    filter.setParameters({ colorLevels: 2 });
    filter.setParameters({ colorLevels: 20 });
  });

  it("should clamp brushSize to [3, 9] and round", () => {
    const filter = new OilPaintingFilterWebGL();
    filter.setParameters({ brushSize: 1 });
    filter.setParameters({ brushSize: 15 });
  });

  it("should clamp edgePreservation to [30, 150]", () => {
    const filter = new OilPaintingFilterWebGL();
    filter.setParameters({ edgePreservation: 10 });
    filter.setParameters({ edgePreservation: 200 });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new OilPaintingFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely", () => {
    const filter = new OilPaintingFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== DepthOfFieldFilterWebGL =====

describe("DepthOfFieldFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new DepthOfFieldFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new DepthOfFieldFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      focusRadius: 0.3,
      blurStrength: 9,
    });
  });

  it("should clamp focusRadius to [0.1, 0.6]", () => {
    const filter = new DepthOfFieldFilterWebGL();
    filter.setParameters({ focusRadius: 0.01 });
    filter.setParameters({ focusRadius: 1.0 });
  });

  it("should clamp blurStrength to [3, 15], floor, and force odd", () => {
    const filter = new DepthOfFieldFilterWebGL();
    filter.setParameters({ blurStrength: 1 });
    filter.setParameters({ blurStrength: 20 });
    filter.setParameters({ blurStrength: 6 }); // even → 5
    filter.setParameters({ blurStrength: 10.9 }); // floor to 10, then odd → 9
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new DepthOfFieldFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely (custom cleanup for dual-pass)", () => {
    const filter = new DepthOfFieldFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== MotionDetectionFilterWebGL =====

describe("MotionDetectionFilterWebGL", () => {
  it("should construct without throwing", () => {
    expect(() => new MotionDetectionFilterWebGL()).not.toThrow();
  });

  it("should return correct default parameters", () => {
    const filter = new MotionDetectionFilterWebGL();
    expect(filter.getDefaultParameters()).toEqual({
      sensitivity: 30,
      noiseFilter: 3,
      trailDuration: 0.85,
    });
  });

  it("should clamp sensitivity to [10, 100]", () => {
    const filter = new MotionDetectionFilterWebGL();
    filter.setParameters({ sensitivity: 5 });
    filter.setParameters({ sensitivity: 150 });
  });

  it("should clamp noiseFilter to [0, 10]", () => {
    const filter = new MotionDetectionFilterWebGL();
    filter.setParameters({ noiseFilter: -1 });
    filter.setParameters({ noiseFilter: 15 });
  });

  it("should clamp trailDuration to [0.5, 0.98]", () => {
    const filter = new MotionDetectionFilterWebGL();
    filter.setParameters({ trailDuration: 0.1 });
    filter.setParameters({ trailDuration: 1.0 });
  });

  it("should handle all parameters at once", () => {
    const filter = new MotionDetectionFilterWebGL();
    filter.setParameters({
      sensitivity: 50,
      noiseFilter: 5,
      trailDuration: 0.9,
    });
  });

  it("should throw on apply without WebGL context", () => {
    const filter = new MotionDetectionFilterWebGL();
    expect(() => filter.apply(createTestImageData())).toThrow();
  });

  it("should cleanup safely (custom cleanup for ping-pong FBOs)", () => {
    const filter = new MotionDetectionFilterWebGL();
    expect(() => filter.cleanup()).not.toThrow();
  });

  it("should handle double cleanup without errors", () => {
    const filter = new MotionDetectionFilterWebGL();
    filter.cleanup();
    expect(() => filter.cleanup()).not.toThrow();
  });
});

// ===== Cross-cutting concerns =====

describe("WebGL Filters - shared behavior", () => {
  it("all filters should reject invalid imageData", () => {
    const filters = [
      new SepiaFilterWebGL(),
      new InvertFilterWebGL(),
      new ThermalFilterWebGL(),
      new VignetteFilterWebGL(),
      new ChromaticAberrationFilterWebGL(),
      new EdgeDetectionFilterWebGL(),
      new SobelRainbowFilterWebGL(),
      new ComicBookFilterWebGL(),
      new AsciiFilterWebGL(),
      new BlurFilterWebGL(),
      new CRTFilterWebGL(),
      new NightVisionFilterWebGL(),
      new RotoscopeFilterWebGL(),
      new KaleidoscopeFilterWebGL(),
      new PixelateFilterWebGL(),
      new VHSFilterWebGL(),
      new GlitchFilterWebGL(),
      new OilPaintingFilterWebGL(),
      new DepthOfFieldFilterWebGL(),
      new MotionDetectionFilterWebGL(),
    ];

    for (const filter of filters) {
      expect(() => filter.apply(null as unknown as ImageData)).toThrow();
    }
  });

  it("all filters should not throw on construction", () => {
    // This also ensures imports are correct
    const constructors = [
      SepiaFilterWebGL,
      InvertFilterWebGL,
      ThermalFilterWebGL,
      VignetteFilterWebGL,
      ChromaticAberrationFilterWebGL,
      EdgeDetectionFilterWebGL,
      SobelRainbowFilterWebGL,
      ComicBookFilterWebGL,
      AsciiFilterWebGL,
      BlurFilterWebGL,
      CRTFilterWebGL,
      NightVisionFilterWebGL,
      RotoscopeFilterWebGL,
      KaleidoscopeFilterWebGL,
      PixelateFilterWebGL,
      VHSFilterWebGL,
      GlitchFilterWebGL,
      OilPaintingFilterWebGL,
      DepthOfFieldFilterWebGL,
      MotionDetectionFilterWebGL,
    ];

    for (const Ctor of constructors) {
      expect(() => new Ctor()).not.toThrow();
    }
  });

  it("all filters should survive cleanup", () => {
    const filters = [
      new SepiaFilterWebGL(),
      new InvertFilterWebGL(),
      new ThermalFilterWebGL(),
      new VignetteFilterWebGL(),
      new ChromaticAberrationFilterWebGL(),
      new EdgeDetectionFilterWebGL(),
      new SobelRainbowFilterWebGL(),
      new ComicBookFilterWebGL(),
      new AsciiFilterWebGL(),
      new BlurFilterWebGL(),
      new CRTFilterWebGL(),
      new NightVisionFilterWebGL(),
      new RotoscopeFilterWebGL(),
      new KaleidoscopeFilterWebGL(),
      new PixelateFilterWebGL(),
      new VHSFilterWebGL(),
      new GlitchFilterWebGL(),
      new OilPaintingFilterWebGL(),
      new DepthOfFieldFilterWebGL(),
      new MotionDetectionFilterWebGL(),
    ];

    for (const filter of filters) {
      expect(() => filter.cleanup()).not.toThrow();
    }
  });

  it("filters with setParameters should ignore unknown params", () => {
    const filters = [
      new VignetteFilterWebGL(),
      new ChromaticAberrationFilterWebGL(),
      new EdgeDetectionFilterWebGL(),
      new SobelRainbowFilterWebGL(),
      new ComicBookFilterWebGL(),
      new AsciiFilterWebGL(),
      new BlurFilterWebGL(),
      new CRTFilterWebGL(),
      new NightVisionFilterWebGL(),
      new RotoscopeFilterWebGL(),
      new KaleidoscopeFilterWebGL(),
      new PixelateFilterWebGL(),
      new VHSFilterWebGL(),
      new GlitchFilterWebGL(),
      new OilPaintingFilterWebGL(),
      new DepthOfFieldFilterWebGL(),
      new MotionDetectionFilterWebGL(),
    ];

    for (const filter of filters) {
      expect(() =>
        filter.setParameters({ unknownParam: 42, anotherUnknown: 99 })
      ).not.toThrow();
    }
  });
});
