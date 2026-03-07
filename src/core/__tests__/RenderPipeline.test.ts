/**
 * RenderPipeline tests
 * Tests render pipeline logic: filter stack management, aspect ratio calculation,
 * pause/resume, error recovery, and lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RenderPipeline } from "../RenderPipeline";
import type { Filter } from "../../filters/Filter";
import { FPSCounter } from "../FPSCounter";
import { VideoSource } from "../../video/VideoSource";

// --- Mocks ---

class MockFilter implements Filter {
  name = "MockFilter";
  applyCalled = 0;
  cleanedUp = false;

  apply(imageData: ImageData): ImageData {
    this.applyCalled++;
    return imageData;
  }

  cleanup(): void {
    this.cleanedUp = true;
  }

  setParameters(): void {
    // No-op
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createMockCtx() {
  return {
    fillStyle: "",
    font: "",
    strokeStyle: "",
    lineWidth: 0,
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(
      (_x: number, _y: number, w: number, h: number) =>
        ({
          data: new Uint8ClampedArray(w * h * 4),
          width: w,
          height: h,
          colorSpace: "srgb",
        }) as ImageData
    ),
    putImageData: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    strokeText: vi.fn(),
    fillText: vi.fn(),
  };
}

function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;

  const ctx = createMockCtx();
  vi.spyOn(canvas, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );

  return canvas;
}

/**
 * Mock document.createElement to return canvases with mocked 2D context.
 * The RenderPipeline creates an offscreen canvas internally, so we need
 * to intercept that creation.
 */
function mockCreateElement(): void {
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(
    (tagName: string, options?: ElementCreationOptions) => {
      const el = originalCreateElement(tagName, options);
      if (tagName === "canvas") {
        const ctx = createMockCtx();
        vi.spyOn(el as HTMLCanvasElement, "getContext").mockReturnValue(
          ctx as unknown as CanvasRenderingContext2D
        );
      }
      return el;
    }
  );
}

function createMockVideoSource(
  ready = true,
  width = 640,
  height = 480
): VideoSource {
  const vs = Object.create(VideoSource.prototype) as VideoSource;
  vi.spyOn(vs, "isReady").mockReturnValue(ready);
  vi.spyOn(vs, "getDimensions").mockReturnValue({ width, height });

  const videoEl = document.createElement("video");
  vi.spyOn(vs, "getMediaElement").mockReturnValue(videoEl);

  return vs;
}

function createMockFPSCounter(): FPSCounter {
  const fps = new FPSCounter();
  vi.spyOn(fps, "update").mockImplementation(() => {});
  vi.spyOn(fps, "getFPS").mockReturnValue(60);
  return fps;
}

// --- Tests ---

describe("RenderPipeline", () => {
  let canvas: HTMLCanvasElement;
  let videoSource: VideoSource;
  let fpsCounter: FPSCounter;
  let mockFilter: MockFilter;
  let pipeline: RenderPipeline;

  beforeEach(() => {
    // Mock createElement FIRST so offscreen canvas gets mocked context
    mockCreateElement();

    // Mock requestAnimationFrame / cancelAnimationFrame
    let rafId = 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((_cb: FrameRequestCallback) => ++rafId)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    // Mock window resize
    vi.spyOn(window, "addEventListener").mockImplementation(() => {});
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});

    canvas = createMockCanvas();
    videoSource = createMockVideoSource();
    fpsCounter = createMockFPSCounter();
    mockFilter = new MockFilter();
    pipeline = new RenderPipeline(canvas, videoSource, mockFilter, fpsCounter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // --- Construction ---

  it("should initialize with the provided filter", () => {
    expect(pipeline.getCurrentFilterType()).toBe("none");
    expect(pipeline.getFilterStack()).toEqual(["none"]);
  });

  it("should throw if canvas context is unavailable", () => {
    const badCanvas = document.createElement("canvas");
    vi.spyOn(badCanvas, "getContext").mockReturnValue(null);

    expect(
      () => new RenderPipeline(badCanvas, videoSource, mockFilter, fpsCounter)
    ).toThrow("Unable to get 2D context");
  });

  // --- Filter Stack ---

  it("should set a single filter via setFilter", () => {
    const newFilter = new MockFilter();
    pipeline.setFilter(newFilter, "blur");
    expect(pipeline.getCurrentFilterType()).toBe("blur");
    expect(pipeline.getFilterStack()).toEqual(["blur"]);
  });

  it("should set a filter stack and cleanup old filters", () => {
    // Disable smooth transitions so cleanup is immediate
    pipeline.setSmoothTransitions(false);

    // Register initial filter via setFilter so it enters cleanupRegistry
    pipeline.setFilter(mockFilter, "none");

    // Set a new filter stack
    const f1 = new MockFilter();
    const f2 = new MockFilter();
    pipeline.setFilterStack([f1, f2], ["blur", "sepia"]);
    expect(pipeline.getFilterStack()).toEqual(["blur", "sepia"]);

    // Old filter (mockFilter) should have been cleaned up
    expect(mockFilter.cleanedUp).toBe(true);

    // Replace with new filter — old ones should be cleaned up
    const f3 = new MockFilter();
    pipeline.setFilterStack([f3], ["invert"]);
    expect(f1.cleanedUp).toBe(true);
    expect(f2.cleanedUp).toBe(true);
    expect(pipeline.getFilterStack()).toEqual(["invert"]);
  });

  it("should defer cleanup when smooth transitions enabled", () => {
    // Disable transitions for clean setup, then re-enable
    pipeline.setSmoothTransitions(false);
    const oldFilter = new MockFilter();
    pipeline.setFilterStack([oldFilter], ["blur"]);
    pipeline.setSmoothTransitions(true);

    // Set a new filter stack — old filter cleanup should be deferred for transition
    const newFilter = new MockFilter();
    pipeline.setFilterStack([newFilter], ["sepia"]);
    expect(pipeline.getFilterStack()).toEqual(["sepia"]);

    // Old filter should NOT be cleaned up yet (transition in progress)
    expect(oldFilter.cleanedUp).toBe(false);

    // Replacing again should complete pending transition and cleanup old filter
    const anotherFilter = new MockFilter();
    pipeline.setFilterStack([anotherFilter], ["invert"]);
    expect(oldFilter.cleanedUp).toBe(true);
  });

  it("should return a copy of filter stack (immutable)", () => {
    pipeline.setFilterStack([new MockFilter()], ["ascii"]);
    const stack = pipeline.getFilterStack();
    stack.push("blur");
    expect(pipeline.getFilterStack()).toEqual(["ascii"]);
  });

  // --- Aspect Ratio ---

  it("should set aspect ratio mode", () => {
    // Should not throw
    pipeline.setAspectRatioMode("contain");
    pipeline.setAspectRatioMode("cover");
  });

  // --- FPS ---

  it("should toggle showFPS", () => {
    pipeline.setShowFPS(true);
    pipeline.setShowFPS(false);
  });

  // --- Pause / Resume ---

  it("should start with isPaused false", () => {
    expect(pipeline.getIsPaused()).toBe(false);
  });

  it("should pause and resume", () => {
    pipeline.start();
    pipeline.pause();
    expect(pipeline.getIsPaused()).toBe(true);

    pipeline.resume();
    expect(pipeline.getIsPaused()).toBe(false);
  });

  it("should not double-pause", () => {
    pipeline.start();
    pipeline.pause();
    pipeline.pause(); // Second pause is a no-op
    expect(pipeline.getIsPaused()).toBe(true);
  });

  it("should not resume if not paused", () => {
    pipeline.resume(); // Should be a no-op
    expect(pipeline.getIsPaused()).toBe(false);
  });

  // --- Start / Stop ---

  it("should start render loop", () => {
    pipeline.start();
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it("should not start twice", () => {
    pipeline.start();
    pipeline.start();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it("should stop render loop and cleanup filters", () => {
    // Initial filter is not registered — use setFilter to register
    const registeredFilter = new MockFilter();
    pipeline.setFilter(registeredFilter, "blur");
    pipeline.start();
    pipeline.stop();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(registeredFilter.cleanedUp).toBe(true);
  });

  // --- Error Callback ---

  it("should accept error callback", () => {
    const onError = vi.fn();
    pipeline.setOnError(onError);
    // Callback stored, will be invoked on max consecutive errors
    expect(onError).not.toHaveBeenCalled();
  });

  // --- Canvas ---

  it("should return the canvas element", () => {
    expect(pipeline.getCanvas()).toBe(canvas);
  });

  // --- Cleanup ---

  it("should cleanup resources on destroy", () => {
    const registeredFilter = new MockFilter();
    pipeline.setFilter(registeredFilter, "blur");
    pipeline.start();
    pipeline.cleanup();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(registeredFilter.cleanedUp).toBe(true);
  });

  // --- calculateDrawDimensions (tested via aspect ratio behavior) ---

  describe("calculateDrawDimensions", () => {
    // Helper to access private method with proper typing
    type DrawDimResult = { dx: number; dy: number; dw: number; dh: number };
    function calcDraw(
      p: RenderPipeline,
      sw: number,
      sh: number,
      cw: number,
      ch: number
    ): DrawDimResult {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return (p as any).calculateDrawDimensions(sw, sh, cw, ch);
    }

    it("should handle zero source dimensions gracefully", () => {
      const result = calcDraw(pipeline, 0, 0, 640, 480);
      expect(result).toEqual({ dx: 0, dy: 0, dw: 640, dh: 480 });
    });

    it("should handle zero canvas dimensions gracefully", () => {
      const result = calcDraw(pipeline, 640, 480, 0, 0);
      expect(result).toEqual({ dx: 0, dy: 0, dw: 0, dh: 0 });
    });

    it("should letterbox wider source in contain mode", () => {
      pipeline.setAspectRatioMode("contain");
      // 1920x1080 source into 800x600 canvas  (source wider: 16:9 > 4:3)
      const result = calcDraw(pipeline, 1920, 1080, 800, 600);
      // Should fit to width: dw=800, dh=800/1.777...=450, centered vertically
      expect(result.dw).toBe(800);
      expect(result.dh).toBeCloseTo(450, 0);
      expect(result.dx).toBe(0);
      expect(result.dy).toBeCloseTo(75, 0);
    });

    it("should pillarbox taller source in contain mode", () => {
      pipeline.setAspectRatioMode("contain");
      // 480x640 source (portrait) into 800x600 canvas
      const result = calcDraw(pipeline, 480, 640, 800, 600);
      // Source aspect 0.75 < canvas aspect 1.333: fit to height
      expect(result.dh).toBe(600);
      expect(result.dw).toBeCloseTo(450, 0);
      expect(result.dy).toBe(0);
      expect(result.dx).toBeCloseTo(175, 0);
    });

    it("should crop wider source in cover mode", () => {
      pipeline.setAspectRatioMode("cover");
      // 1920x1080 source into 800x600 canvas
      const result = calcDraw(pipeline, 1920, 1080, 800, 600);
      // In cover mode with wider source: fit to height, crop width
      expect(result.dh).toBe(600);
      expect(result.dw).toBeCloseTo(1066.67, 0);
    });
  });

  // --- Filter cleanup robustness ---

  it("should handle filters without cleanup method", () => {
    const simpleFilter: Filter = {
      apply: (d: ImageData) => d,
    };
    // Should not throw even though filter has no cleanup
    pipeline.setFilterStack([simpleFilter], ["none"]);
    pipeline.stop();
  });

  it("should handle filter cleanup throwing an error", () => {
    const badFilter: Filter = {
      apply: (d: ImageData) => d,
      cleanup: () => {
        throw new Error("Cleanup failed");
      },
    };
    pipeline.setFilterStack([badFilter], ["blur"]);
    // Should not throw — error is caught internally
    expect(() => pipeline.stop()).not.toThrow();
  });
});
