/**
 * Bulk filter setParameters / getDefaultParameters / cleanup tests
 * Covers parameter clamping, defaults, and cleanup for all filters that implement these methods.
 */

import { describe, it, expect } from "vitest";
import { BlurFilter } from "../BlurFilter";
import { CRTFilter } from "../CRTFilter";
import { ChromaticAberrationFilter } from "../ChromaticAberrationFilter";
import { ComicBookFilter } from "../ComicBookFilter";
import { DepthOfFieldFilter } from "../DepthOfFieldFilter";
import { MotionDetectionFilter } from "../MotionDetectionFilter";
import { OilPaintingFilter } from "../OilPaintingFilter";
import { PixelateFilter } from "../PixelateFilter";
import { SobelRainbowFilter } from "../SobelRainbowFilter";
import { VignetteFilter } from "../VignetteFilter";
import { KaleidoscopeFilter } from "../KaleidoscopeFilter";
import { EdgeDetectionFilter } from "../EdgeDetectionFilter";
import { RotoscopeFilter } from "../RotoscopeFilter";

// Helper to create test ImageData
function makeImageData(w = 20, h = 20): ImageData {
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4).fill(128),
    colorSpace: "srgb" as PredefinedColorSpace,
  };
}

// --- BlurFilter ---

describe("BlurFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new BlurFilter();
    expect(f.getDefaultParameters()).toEqual({ kernelSize: 5 });
  });

  it("should clamp kernelSize to 3-15 and force odd", () => {
    const f = new BlurFilter();

    f.setParameters({ kernelSize: 1 });
    // @ts-expect-error - access private
    expect(f.kernelSize).toBe(3); // min

    f.setParameters({ kernelSize: 20 });
    // @ts-expect-error - access private
    expect(f.kernelSize).toBe(15); // max

    f.setParameters({ kernelSize: 6 }); // even → 7
    // @ts-expect-error - access private
    expect(f.kernelSize).toBe(7);
  });

  it("should nullify tempBuffer on cleanup", () => {
    const f = new BlurFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.tempBuffer).toBeNull();
  });
});

// --- CRTFilter ---

describe("CRTFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new CRTFilter();
    expect(f.getDefaultParameters()).toEqual({
      scanlineDarkness: 0.3,
      scanlineSpacing: 2,
      bloomIntensity: 0.15,
    });
  });

  it("should clamp scanlineDarkness to 0-1", () => {
    const f = new CRTFilter();
    f.setParameters({ scanlineDarkness: -0.5 });
    // @ts-expect-error - access private
    expect(f.scanlineDarkness).toBe(0);

    f.setParameters({ scanlineDarkness: 2 });
    // @ts-expect-error - access private
    expect(f.scanlineDarkness).toBe(1);
  });

  it("should clamp scanlineSpacing to 1-6 and round", () => {
    const f = new CRTFilter();
    f.setParameters({ scanlineSpacing: 0 });
    // @ts-expect-error - access private
    expect(f.scanlineSpacing).toBe(1);

    f.setParameters({ scanlineSpacing: 10 });
    // @ts-expect-error - access private
    expect(f.scanlineSpacing).toBe(6);
  });

  it("should clamp bloomIntensity to 0-0.5", () => {
    const f = new CRTFilter();
    f.setParameters({ bloomIntensity: -1 });
    // @ts-expect-error - access private
    expect(f.bloomIntensity).toBe(0);

    f.setParameters({ bloomIntensity: 1 });
    // @ts-expect-error - access private
    expect(f.bloomIntensity).toBe(0.5);
  });

  it("should nullify bloomBuffer on cleanup", () => {
    const f = new CRTFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.bloomBuffer).toBeNull();
  });
});

// --- ChromaticAberrationFilter ---

describe("ChromaticAberrationFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new ChromaticAberrationFilter();
    expect(f.getDefaultParameters()).toEqual({ offset: 3 });
  });

  it("should clamp offset to 1-10 and floor", () => {
    const f = new ChromaticAberrationFilter();
    f.setParameters({ offset: 0 });
    // @ts-expect-error - access private
    expect(f.offset).toBe(1);

    f.setParameters({ offset: 20 });
    // @ts-expect-error - access private
    expect(f.offset).toBe(10);

    f.setParameters({ offset: 5.7 });
    // @ts-expect-error - access private
    expect(f.offset).toBe(5);
  });

  it("should nullify tempBuffer on cleanup", () => {
    const f = new ChromaticAberrationFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.tempBuffer).toBeNull();
  });
});

// --- ComicBookFilter ---

describe("ComicBookFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new ComicBookFilter();
    expect(f.getDefaultParameters()).toEqual({ edgeSensitivity: 100 });
  });

  it("should clamp edgeSensitivity to 30-200", () => {
    const f = new ComicBookFilter();
    f.setParameters({ edgeSensitivity: 10 });
    // @ts-expect-error - access private
    expect(f.edgeSensitivity).toBe(30);

    f.setParameters({ edgeSensitivity: 300 });
    // @ts-expect-error - access private
    expect(f.edgeSensitivity).toBe(200);
  });

  it("should nullify edgeBuffer on cleanup", () => {
    const f = new ComicBookFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.edgeBuffer).toBeNull();
  });
});

// --- DepthOfFieldFilter ---

describe("DepthOfFieldFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new DepthOfFieldFilter();
    expect(f.getDefaultParameters()).toEqual({
      focusRadius: 0.3,
      blurStrength: 9,
    });
  });

  it("should clamp focusRadius to 0.1-0.6", () => {
    const f = new DepthOfFieldFilter();
    f.setParameters({ focusRadius: 0 });
    // @ts-expect-error - access private
    expect(f.focusRadius).toBe(0.1);

    f.setParameters({ focusRadius: 1 });
    // @ts-expect-error - access private
    expect(f.focusRadius).toBe(0.6);
  });

  it("should clamp blurStrength to 3-15 and floor", () => {
    const f = new DepthOfFieldFilter();
    f.setParameters({ blurStrength: 1 });
    // @ts-expect-error - access private
    expect(f.blurStrength).toBe(3);

    f.setParameters({ blurStrength: 20 });
    // @ts-expect-error - access private
    expect(f.blurStrength).toBe(15);
  });

  it("should nullify buffers on cleanup", () => {
    const f = new DepthOfFieldFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.blurBuffer).toBeNull();
    // @ts-expect-error - access private
    expect(f.distanceMap).toBeNull();
  });
});

// --- MotionDetectionFilter ---

describe("MotionDetectionFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new MotionDetectionFilter();
    expect(f.getDefaultParameters()).toEqual({
      sensitivity: 30,
      noiseFilter: 3,
      trailDuration: 0.85,
    });
  });

  it("should clamp sensitivity to 10-100", () => {
    const f = new MotionDetectionFilter();
    f.setParameters({ sensitivity: 5 });
    // @ts-expect-error - access private
    expect(f.sensitivity).toBe(10);

    f.setParameters({ sensitivity: 200 });
    // @ts-expect-error - access private
    expect(f.sensitivity).toBe(100);
  });

  it("should clamp noiseFilter to 0-10", () => {
    const f = new MotionDetectionFilter();
    f.setParameters({ noiseFilter: -5 });
    // @ts-expect-error - access private
    expect(f.noiseFilter).toBe(0);

    f.setParameters({ noiseFilter: 20 });
    // @ts-expect-error - access private
    expect(f.noiseFilter).toBe(10);
  });

  it("should clamp trailDuration to 0.5-0.98", () => {
    const f = new MotionDetectionFilter();
    f.setParameters({ trailDuration: 0.1 });
    // @ts-expect-error - access private
    expect(f.trailDuration).toBe(0.5);

    f.setParameters({ trailDuration: 1.5 });
    // @ts-expect-error - access private
    expect(f.trailDuration).toBe(0.98);
  });

  it("should nullify buffers on cleanup", () => {
    const f = new MotionDetectionFilter();
    f.apply(makeImageData());
    f.apply(makeImageData()); // need 2 frames for previousFrame
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.previousFrame).toBeNull();
    // @ts-expect-error - access private
    expect(f.motionHeatmap).toBeNull();
  });
});

// --- OilPaintingFilter ---

describe("OilPaintingFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new OilPaintingFilter();
    expect(f.getDefaultParameters()).toEqual({
      colorLevels: 8,
      brushSize: 5,
      edgePreservation: 80,
    });
  });

  it("should clamp colorLevels to 4-16 and round", () => {
    const f = new OilPaintingFilter();
    f.setParameters({ colorLevels: 2 });
    // @ts-expect-error - access private
    expect(f.colorLevels).toBe(4);

    f.setParameters({ colorLevels: 20 });
    // @ts-expect-error - access private
    expect(f.colorLevels).toBe(16);
  });

  it("should clamp brushSize to 3-9 and round", () => {
    const f = new OilPaintingFilter();
    f.setParameters({ brushSize: 1 });
    // @ts-expect-error - access private
    expect(f.brushSize).toBe(3);

    f.setParameters({ brushSize: 15 });
    // @ts-expect-error - access private
    expect(f.brushSize).toBe(9);
  });

  it("should clamp edgePreservation to 30-150", () => {
    const f = new OilPaintingFilter();
    f.setParameters({ edgePreservation: 10 });
    // @ts-expect-error - access private
    expect(f.edgePreservation).toBe(30);

    f.setParameters({ edgePreservation: 200 });
    // @ts-expect-error - access private
    expect(f.edgePreservation).toBe(150);
  });

  it("should nullify tempBuffer on cleanup", () => {
    const f = new OilPaintingFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.tempBuffer).toBeNull();
  });
});

// --- PixelateFilter ---

describe("PixelateFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new PixelateFilter();
    expect(f.getDefaultParameters()).toEqual({
      horizontalResolution: 160,
      verticalResolution: 144,
    });
  });

  it("should clamp horizontalResolution to 80-320 and floor", () => {
    const f = new PixelateFilter();
    f.setParameters({ horizontalResolution: 50 });
    // @ts-expect-error - access private
    expect(f.horizontalResolution).toBe(80);

    f.setParameters({ horizontalResolution: 500 });
    // @ts-expect-error - access private
    expect(f.horizontalResolution).toBe(320);
  });

  it("should clamp verticalResolution to 72-288 and floor", () => {
    const f = new PixelateFilter();
    f.setParameters({ verticalResolution: 40 });
    // @ts-expect-error - access private
    expect(f.verticalResolution).toBe(72);

    f.setParameters({ verticalResolution: 400 });
    // @ts-expect-error - access private
    expect(f.verticalResolution).toBe(288);
  });

  it("should nullify originalDataBuffer on cleanup", () => {
    const f = new PixelateFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.originalDataBuffer).toBeNull();
  });
});

// --- SobelRainbowFilter ---

describe("SobelRainbowFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new SobelRainbowFilter();
    expect(f.getDefaultParameters()).toEqual({ edgeSensitivity: 50 });
  });

  it("should clamp edgeSensitivity to 10-150", () => {
    const f = new SobelRainbowFilter();
    f.setParameters({ edgeSensitivity: 5 });
    // @ts-expect-error - access private
    expect(f.edgeSensitivity).toBe(10);

    f.setParameters({ edgeSensitivity: 200 });
    // @ts-expect-error - access private
    expect(f.edgeSensitivity).toBe(150);
  });
});

// --- VignetteFilter ---

describe("VignetteFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new VignetteFilter();
    expect(f.getDefaultParameters()).toEqual({ strength: 0.6 });
  });

  it("should clamp strength to 0-1", () => {
    const f = new VignetteFilter();
    f.setParameters({ strength: -0.5 });
    // @ts-expect-error - access private
    expect(f.strength).toBe(0);

    f.setParameters({ strength: 2 });
    // @ts-expect-error - access private
    expect(f.strength).toBe(1);
  });
});

// --- KaleidoscopeFilter ---

describe("KaleidoscopeFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new KaleidoscopeFilter();
    expect(f.getDefaultParameters()).toEqual({
      segments: 6,
      autoRotateEnabled: 0,
      rotationSpeed: 0.5,
    });
  });

  it("should clamp segments to 3-12 and floor", () => {
    const f = new KaleidoscopeFilter();
    f.setParameters({ segments: 1 });
    // @ts-expect-error - access private
    expect(f.segments).toBe(3);

    f.setParameters({ segments: 20 });
    // @ts-expect-error - access private
    expect(f.segments).toBe(12);
  });

  it("should toggle autoRotate via autoRotate param", () => {
    const f = new KaleidoscopeFilter();

    f.setParameters({ autoRotate: 1.5 }); // > 0 → enable with speed
    // @ts-expect-error - access private
    expect(f.autoRotateEnabled).toBe(true);

    f.setParameters({ autoRotate: 0 }); // 0 → disable
    // @ts-expect-error - access private
    expect(f.autoRotateEnabled).toBe(false);
  });

  it("should set autoRotateEnabled as boolean via 0/1", () => {
    const f = new KaleidoscopeFilter();

    f.setParameters({ autoRotateEnabled: 1 });
    // @ts-expect-error - access private
    expect(f.autoRotateEnabled).toBe(true);

    f.setParameters({ autoRotateEnabled: 0 });
    // @ts-expect-error - access private
    expect(f.autoRotateEnabled).toBe(false);
  });

  it("should set rotation offset from degrees", () => {
    const f = new KaleidoscopeFilter();
    f.setParameters({ rotation: 180 });
    // @ts-expect-error - access private
    expect(f.rotationOffset).toBeCloseTo(Math.PI);
  });

  it("should nullify sourceBuffer on cleanup", () => {
    const f = new KaleidoscopeFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.sourceBuffer).toBeNull();
  });
});

// --- EdgeDetectionFilter ---

describe("EdgeDetectionFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new EdgeDetectionFilter();
    expect(f.getDefaultParameters()).toEqual({ edgeSensitivity: 50 });
  });

  it("should clamp edgeSensitivity to 10-150", () => {
    const f = new EdgeDetectionFilter();
    f.setParameters({ edgeSensitivity: 5 });
    // @ts-expect-error - access private
    expect(f.edgeSensitivity).toBe(10);

    f.setParameters({ edgeSensitivity: 200 });
    // @ts-expect-error - access private
    expect(f.edgeSensitivity).toBe(150);
  });

  it("should nullify sobelBuffer on cleanup", () => {
    const f = new EdgeDetectionFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.sobelBuffer).toBeNull();
  });
});

// --- RotoscopeFilter ---

describe("RotoscopeFilter parameters", () => {
  it("should return correct defaults", () => {
    const f = new RotoscopeFilter();
    expect(f.getDefaultParameters()).toEqual({
      colorLevels: 6,
      edgeSensitivity: 30,
      edgeDarkness: 0.8,
    });
  });

  it("should clamp colorLevels to 3-12 and round", () => {
    const f = new RotoscopeFilter();
    f.setParameters({ colorLevels: 1 });
    // @ts-expect-error - access private
    expect(f.colorLevels).toBe(3);

    f.setParameters({ colorLevels: 20 });
    // @ts-expect-error - access private
    expect(f.colorLevels).toBe(12);
  });

  it("should clamp edgeSensitivity to 10-100", () => {
    const f = new RotoscopeFilter();
    f.setParameters({ edgeSensitivity: 5 });
    // @ts-expect-error - access private
    expect(f.edgeSensitivity).toBe(10);

    f.setParameters({ edgeSensitivity: 200 });
    // @ts-expect-error - access private
    expect(f.edgeSensitivity).toBe(100);
  });

  it("should clamp edgeDarkness to 0-1", () => {
    const f = new RotoscopeFilter();
    f.setParameters({ edgeDarkness: -0.5 });
    // @ts-expect-error - access private
    expect(f.edgeDarkness).toBe(0);

    f.setParameters({ edgeDarkness: 2 });
    // @ts-expect-error - access private
    expect(f.edgeDarkness).toBe(1);
  });

  it("should nullify edgeBuffer on cleanup", () => {
    const f = new RotoscopeFilter();
    f.apply(makeImageData());
    f.cleanup();
    // @ts-expect-error - access private
    expect(f.edgeBuffer).toBeNull();
  });
});
