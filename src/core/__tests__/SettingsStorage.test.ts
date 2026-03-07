/**
 * SettingsStorage tests
 * V6 - LocalStorage persistence utility tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SettingsStorage } from "../SettingsStorage";
import type { StoredSettings } from "../../types";

describe("SettingsStorage", () => {
  // Mock localStorage
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    (globalThis as Record<string, unknown>)["localStorage"] = {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should save and load settings (round-trip)", () => {
    const settings: StoredSettings = {
      version: 6,
      filterParams: {
        blur: { type: "blur", kernelSize: 7 },
        vignette: { type: "vignette", strength: 0.8 },
      },
      filterStack: ["blur", "vignette"],
      webglEnabled: true,
      smoothTransitionsEnabled: true,
      kaleidoscopeAutoRotate: { enabled: true, speed: 1.5 },
    };

    // Save with flush (immediate, no debounce)
    SettingsStorage.flush(settings);

    // Load back
    const loaded = SettingsStorage.load();

    expect(loaded).toEqual(settings);
  });

  it("should return null if no saved settings", () => {
    const loaded = SettingsStorage.load();
    expect(loaded).toBeNull();
  });

  it("should handle corrupted JSON gracefully", () => {
    localStorageMock["cameraExperimentSettings_v6"] = "{invalid json";

    const loaded = SettingsStorage.load();
    expect(loaded).toBeNull();
  });

  it("should reject incompatible version", () => {
    const oldVersion = {
      version: 5, // Wrong version
      filterParams: {},
      filterStack: [],
      webglEnabled: false,
      smoothTransitionsEnabled: true,
      kaleidoscopeAutoRotate: { enabled: false, speed: 0.5 },
    };

    localStorageMock["cameraExperimentSettings_v6"] =
      JSON.stringify(oldVersion);

    const loaded = SettingsStorage.load();
    expect(loaded).toBeNull();
  });

  it("should debounce save calls", () => {
    vi.useFakeTimers();

    const settings: StoredSettings = {
      version: 6,
      filterParams: {},
      filterStack: ["none"],
      webglEnabled: false,
      smoothTransitionsEnabled: true,
      kaleidoscopeAutoRotate: { enabled: false, speed: 0.5 },
    };

    // Call save 3 times rapidly
    SettingsStorage.save(settings);
    SettingsStorage.save(settings);
    SettingsStorage.save(settings);

    // Should not have saved yet (debounced)
    expect(localStorage.setItem).not.toHaveBeenCalled();

    // Fast-forward 500ms
    vi.advanceTimersByTime(500);

    // Now should have saved once
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should clear all settings", () => {
    const settings: StoredSettings = {
      version: 6,
      filterParams: {},
      filterStack: ["none"],
      webglEnabled: false,
      smoothTransitionsEnabled: true,
      kaleidoscopeAutoRotate: { enabled: false, speed: 0.5 },
    };

    SettingsStorage.flush(settings);
    expect(SettingsStorage.load()).not.toBeNull();

    SettingsStorage.clear();
    expect(SettingsStorage.load()).toBeNull();
  });

  it("should handle quota exceeded error gracefully", () => {
    // Mock quota exceeded
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      const error = new Error("QuotaExceededError");
      error.name = "QuotaExceededError";
      throw error;
    });

    const settings: StoredSettings = {
      version: 6,
      filterParams: {},
      filterStack: ["none"],
      webglEnabled: false,
      smoothTransitionsEnabled: true,
      kaleidoscopeAutoRotate: { enabled: false, speed: 0.5 },
    };

    // Should not throw
    expect(() => SettingsStorage.flush(settings)).not.toThrow();
  });
});
