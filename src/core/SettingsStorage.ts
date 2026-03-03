/**
 * SettingsStorage - LocalStorage persistence utility for V6 settings
 * Handles debounced saves, error handling, and beforeunload flush
 */

import { StoredSettings } from "../types";
import { Logger } from "../utils/Logger";

export class SettingsStorage {
  private static readonly STORAGE_KEY = "cameraExperimentSettings_v6";
  private static saveTimeout: number | null = null;
  private static readonly DEBOUNCE_MS = 500;

  /**
   * Save settings to localStorage with debouncing
   * Prevents excessive writes during slider drag
   * @param settings - Settings object to persist
   */
  static save(settings: StoredSettings): void {
    // Clear existing timeout
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }

    // Debounce: delay save by DEBOUNCE_MS
    this.saveTimeout = window.setTimeout(() => {
      this.flush(settings);
    }, this.DEBOUNCE_MS);
  }

  /**
   * Flush settings immediately without debouncing
   * Used for beforeunload to prevent data loss
   * @param settings - Settings object to persist (required)
   */
  static flush(settings?: StoredSettings): void {
    if (settings === undefined) {
      return; // Can't flush without settings
    }

    // Clear any pending timeout
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    try {
      const json = JSON.stringify(settings);
      localStorage.setItem(this.STORAGE_KEY, json);
      Logger.debug("Settings saved to localStorage");
    } catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") {
        Logger.warn("localStorage quota exceeded, skipping save");
      } else {
        Logger.error(
          "Failed to save settings",
          error instanceof Error ? error : undefined
        );
      }
    }
  }

  /**
   * Load settings from localStorage
   * @returns Parsed settings object or null if not found/corrupted
   */
  static load(): StoredSettings | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data === null || data.length === 0) {
        Logger.debug("No saved settings found");
        return null;
      }

      const parsed = JSON.parse(data) as StoredSettings;

      // Validate schema version
      if (parsed.version !== 6) {
        Logger.warn(
          `Incompatible settings version: ${parsed.version}, expected 6`
        );
        return null;
      }

      Logger.debug("Settings loaded from localStorage");
      return parsed;
    } catch (error) {
      Logger.error(
        "Failed to load settings, using defaults",
        error instanceof Error ? error : undefined
      );
      return null;
    }
  }

  /**
   * Clear all saved settings
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      Logger.debug("Settings cleared from localStorage");
    } catch (error) {
      Logger.error(
        "Failed to clear settings",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Initialize beforeunload handler to flush on tab close
   * Call this once during app initialization
   */
  static initializeBeforeUnloadHandler(
    getCurrentSettings: () => StoredSettings
  ): void {
    window.addEventListener("beforeunload", () => {
      const settings = getCurrentSettings();
      this.flush(settings);
    });
  }
}
