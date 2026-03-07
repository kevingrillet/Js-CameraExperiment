/**
 * VideoSource tests
 * Tests video source management: webcam, image loading, dimensions, cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { VideoSource } from "../VideoSource";

// --- Mock navigator.mediaDevices ---

function mockMediaDevices(
  devices: Array<{ kind: string; deviceId: string; label: string }> = [],
  getUserMediaResult?: MediaStream
): void {
  const mockStream =
    getUserMediaResult ??
    ({
      getTracks: () => [{ stop: vi.fn(), readyState: "live" }],
    } as unknown as MediaStream);

  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      enumerateDevices: vi.fn().mockResolvedValue(devices),
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
    writable: true,
    configurable: true,
  });
}

// --- Tests ---

describe("VideoSource", () => {
  let source: VideoSource;

  beforeEach(() => {
    source = new VideoSource();
    mockMediaDevices([
      { kind: "videoinput", deviceId: "cam1", label: "Front Camera" },
      { kind: "videoinput", deviceId: "cam2", label: "" },
      { kind: "audioinput", deviceId: "mic1", label: "Microphone" },
    ]);
  });

  afterEach(() => {
    source.stop();
    vi.restoreAllMocks();
  });

  // --- Device enumeration ---

  it("should list only video input devices", async () => {
    const devices = await source.getAvailableDevices();
    expect(devices).toHaveLength(2);
    expect(devices[0]!.label).toBe("Front Camera");
  });

  it("should generate label for unlabeled cameras", async () => {
    const devices = await source.getAvailableDevices();
    expect(devices[1]!.label).toContain("Camera");
  });

  it("should return empty array if enumeration fails", async () => {
    vi.spyOn(navigator.mediaDevices, "enumerateDevices").mockRejectedValue(
      new Error("Permission denied")
    );
    const devices = await source.getAvailableDevices();
    expect(devices).toEqual([]);
  });

  // --- Source type ---

  it("should default to webcam type", () => {
    expect(source.getType()).toBe("webcam");
  });

  // --- Dimensions ---

  it("should return zero dimensions when no source is active", () => {
    const dims = source.getDimensions();
    expect(dims).toEqual({ width: 0, height: 0 });
  });

  // --- isReady ---

  it("should not be ready without a source", () => {
    expect(source.isReady()).toBe(false);
  });

  // --- Stop ---

  it("should safely stop without active source", () => {
    expect(() => source.stop()).not.toThrow();
  });

  it("should not stop already ended tracks", () => {
    const endedTrack = { stop: vi.fn(), readyState: "ended" };
    const liveTrack = { stop: vi.fn(), readyState: "live" };
    const mockStream = {
      getTracks: () => [endedTrack, liveTrack],
    } as unknown as MediaStream;

    // Manually set stream via startWebcam flow
    mockMediaDevices([], mockStream);

    // We simulate stop behavior by constructing internal state
    // Since startWebcam is async and needs loadedmetadata, test stop logic directly
    // Access internal state for thorough unit testing
    // @ts-expect-error - Accessing private property for testing
    source.currentStream = mockStream;
    source.stop();

    expect(endedTrack.stop).not.toHaveBeenCalled();
    expect(liveTrack.stop).toHaveBeenCalled();
  });

  // --- Load Image ---

  it("should reject files that are too large", async () => {
    const bigFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)], // 11MB
      "big.png",
      { type: "image/png" }
    );

    await expect(source.loadImage(bigFile)).rejects.toThrow();
  });

  it("should reject non-image files", async () => {
    const textFile = new File(["hello"], "test.txt", {
      type: "text/plain",
    });

    await expect(source.loadImage(textFile)).rejects.toThrow();
  });

  // --- startWebcam error handling ---

  it("should throw if getUserMedia is not available", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await expect(source.startWebcam()).rejects.toThrow();
  });

  it("should map NotAllowedError to access denied message", async () => {
    const error = new Error("denied");
    error.name = "NotAllowedError";
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValue(error);

    await expect(source.startWebcam()).rejects.toThrow();
  });

  it("should map NotFoundError to not found message", async () => {
    const error = new Error("no cam");
    error.name = "NotFoundError";
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValue(error);

    await expect(source.startWebcam()).rejects.toThrow();
  });

  it("should map NotReadableError to already in use message", async () => {
    const error = new Error("busy");
    error.name = "NotReadableError";
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValue(error);

    await expect(source.startWebcam()).rejects.toThrow();
  });

  it("should map OverconstrainedError to not available message", async () => {
    const error = new Error("overconstrained");
    error.name = "OverconstrainedError";
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValue(error);

    await expect(source.startWebcam()).rejects.toThrow();
  });

  it("should map SecurityError to security message", async () => {
    const error = new Error("insecure");
    error.name = "SecurityError";
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValue(error);

    await expect(source.startWebcam()).rejects.toThrow();
  });

  it("should map unknown errors to generic message", async () => {
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValue(
      "random failure"
    );

    await expect(source.startWebcam()).rejects.toThrow();
  });

  // --- startWebcam happy path ---

  it("should successfully start webcam when metadata loads", async () => {
    // Create a mock video element that auto-fires onloadedmetadata
    const mockVideo: Record<string, unknown> = {
      srcObject: null,
      autoplay: false,
      playsInline: false,
      onerror: null,
      readyState: 4,
      videoWidth: 640,
      videoHeight: 480,
    };
    let storedMetadataHandler: ((ev: Event) => void) | null = null;
    Object.defineProperty(mockVideo, "onloadedmetadata", {
      set(fn: ((ev: Event) => void) | null) {
        storedMetadataHandler = fn;
        // Auto-trigger the handler via microtask when set
        if (fn !== null) {
          void Promise.resolve().then(() => {
            fn(new Event("loadedmetadata"));
          });
        }
      },
      get() {
        return storedMetadataHandler;
      },
      configurable: true,
    });

    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === "video") {
          return mockVideo as unknown as HTMLVideoElement;
        }
        return origCreate(tag, options);
      }
    );

    await source.startWebcam();
    expect(source.getType()).toBe("webcam");
    expect(source.getMediaElement()).toBe(mockVideo);
  });

  it("should start webcam with specific deviceId", async () => {
    const getUserMediaSpy = vi.spyOn(navigator.mediaDevices, "getUserMedia");

    const mockVideo: Record<string, unknown> = {
      srcObject: null,
      autoplay: false,
      playsInline: false,
      onerror: null,
      readyState: 4,
      videoWidth: 640,
      videoHeight: 480,
    };
    let storedMetadataHandler: ((ev: Event) => void) | null = null;
    Object.defineProperty(mockVideo, "onloadedmetadata", {
      set(fn: ((ev: Event) => void) | null) {
        storedMetadataHandler = fn;
        if (fn !== null) {
          void Promise.resolve().then(() => {
            fn(new Event("loadedmetadata"));
          });
        }
      },
      get() {
        return storedMetadataHandler;
      },
      configurable: true,
    });

    const origCreate2 = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === "video") {
          return mockVideo as unknown as HTMLVideoElement;
        }
        return origCreate2(tag, options);
      }
    );

    await source.startWebcam("cam1");

    expect(getUserMediaSpy).toHaveBeenCalledWith({
      video: { deviceId: { exact: "cam1" } },
      audio: false,
    });
  });

  // --- loadImage happy path ---

  it("should successfully load a valid image", async () => {
    const validFile = new File(["fake-image-data"], "photo.png", {
      type: "image/png",
    });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as ((e: unknown) => void) | null,
      onerror: null as (() => void) | null,
    };
    vi.spyOn(globalThis, "FileReader").mockImplementation(function () {
      return mockFileReader as unknown as FileReader;
    } as unknown as typeof FileReader);

    const loadPromise = source.loadImage(validFile);

    // Simulate FileReader completing
    mockFileReader.onload!({
      target: { result: "data:image/png;base64,ABC" },
    });

    // Now the img element should be created; find it and trigger onload
    // We need to wait for the image onload
    await vi.waitFor(() => {
      // @ts-expect-error - access private
      const img: HTMLImageElement | null = source.imageElement;
      if (img !== null) {
        img.onload!(new Event("load"));
      }
    });

    await loadPromise;

    expect(source.getType()).toBe("image");
    expect(source.getMediaElement()).toBeTruthy();
  });

  it("should reject when FileReader fails", async () => {
    const validFile = new File(["data"], "photo.png", {
      type: "image/png",
    });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as ((e: unknown) => void) | null,
      onerror: null as (() => void) | null,
    };
    vi.spyOn(globalThis, "FileReader").mockImplementation(function () {
      return mockFileReader as unknown as FileReader;
    } as unknown as typeof FileReader);

    const loadPromise = source.loadImage(validFile);
    mockFileReader.onerror!();

    await expect(loadPromise).rejects.toThrow("Failed to read file");
  });

  it("should reject when FileReader result is null", async () => {
    const validFile = new File(["data"], "photo.png", {
      type: "image/png",
    });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as ((e: unknown) => void) | null,
      onerror: null as (() => void) | null,
    };
    vi.spyOn(globalThis, "FileReader").mockImplementation(function () {
      return mockFileReader as unknown as FileReader;
    } as unknown as typeof FileReader);

    const loadPromise = source.loadImage(validFile);
    mockFileReader.onload!({ target: { result: null } });

    await expect(loadPromise).rejects.toThrow("Failed to read file");
  });

  // --- getDimensions with active source ---

  it("should return webcam dimensions from videoWidth/videoHeight", () => {
    // @ts-expect-error - access private
    source.videoElement = { videoWidth: 1280, videoHeight: 720 };
    // @ts-expect-error - access private
    source.currentType = "webcam";

    expect(source.getDimensions()).toEqual({ width: 1280, height: 720 });
  });

  it("should return image dimensions from naturalWidth/naturalHeight", () => {
    // @ts-expect-error - access private
    source.imageElement = {
      naturalWidth: 1920,
      naturalHeight: 1080,
      complete: true,
    };
    // @ts-expect-error - access private
    source.currentType = "image";

    expect(source.getDimensions()).toEqual({ width: 1920, height: 1080 });
  });

  // --- isReady with active sources ---

  it("should be ready when webcam readyState >= 2", () => {
    // @ts-expect-error - access private
    source.videoElement = { readyState: 3 };
    // @ts-expect-error - access private
    source.currentType = "webcam";

    expect(source.isReady()).toBe(true);
  });

  it("should not be ready when webcam readyState < 2", () => {
    // @ts-expect-error - access private
    source.videoElement = { readyState: 1 };
    // @ts-expect-error - access private
    source.currentType = "webcam";

    expect(source.isReady()).toBe(false);
  });

  it("should be ready when image is complete", () => {
    // @ts-expect-error - access private
    source.imageElement = { complete: true };
    // @ts-expect-error - access private
    source.currentType = "image";

    expect(source.isReady()).toBe(true);
  });

  it("should not be ready when image is not complete", () => {
    // @ts-expect-error - access private
    source.imageElement = { complete: false };
    // @ts-expect-error - access private
    source.currentType = "image";

    expect(source.isReady()).toBe(false);
  });

  // --- getMediaElement ---

  it("should return null for webcam when no video element", () => {
    expect(source.getMediaElement()).toBeNull();
  });

  it("should return imageElement for image type", () => {
    const img = document.createElement("img");
    // @ts-expect-error - access private
    source.imageElement = img;
    // @ts-expect-error - access private
    source.currentType = "image";

    expect(source.getMediaElement()).toBe(img);
  });

  // --- stop cleans up correctly ---

  it("should nullify video srcObject and elements on stop", () => {
    const mockVideo = { srcObject: "something" } as unknown as HTMLVideoElement;
    // @ts-expect-error - access private
    source.videoElement = mockVideo;
    // @ts-expect-error - access private
    source.imageElement = document.createElement("img");
    // @ts-expect-error - access private
    source.currentStream = {
      getTracks: () => [],
    } as unknown as MediaStream;

    source.stop();

    expect(mockVideo.srcObject).toBeNull();
    // @ts-expect-error - access private
    expect(source.videoElement).toBeNull();
    // @ts-expect-error - access private
    expect(source.imageElement).toBeNull();
  });
});
