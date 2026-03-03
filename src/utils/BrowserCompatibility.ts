/**
 * BrowserCompatibility - Browser detection and compatibility checks
 * Validates required APIs for video filter application
 */

import { Logger } from "./Logger";

export interface CompatibilityResult {
  compatible: boolean;
  missing: string[];
}

export interface BrowserInfo {
  name: string;
  version: string;
  isSafari: boolean;
}

export class BrowserCompatibility {
  /**
   * Check if browser supports all required APIs
   * @returns Compatibility result with list of missing features
   */
  static checkCompatibility(): CompatibilityResult {
    const missing: string[] = [];

    // Check MediaStream API (getUserMedia for webcam)
    if (
      navigator.mediaDevices === undefined ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      missing.push("MediaStream API (getUserMedia)");
    }

    // Check Canvas2D API
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        missing.push("Canvas 2D API");
      }
    } catch {
      missing.push("Canvas 2D API");
    }

    // Check Blob API (for image export)
    if (typeof Blob === "undefined") {
      missing.push("Blob API");
    }

    // Check requestAnimationFrame
    if (typeof window.requestAnimationFrame !== "function") {
      missing.push("requestAnimationFrame");
    }

    // Check localStorage
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
    } catch {
      missing.push("localStorage");
    }

    const compatible = missing.length === 0;

    if (!compatible) {
      Logger.warn(
        `Browser compatibility check failed. Missing: ${missing.join(", ")}`
      );
    }

    return { compatible, missing };
  }

  /**
   * Get basic browser information
   * @returns Browser name and version
   */
  static getBrowserInfo(): BrowserInfo {
    const ua = navigator.userAgent;
    let name = "Unknown";
    let version = "0";
    let isSafari = false;

    // Safari detection (must come before Chrome, as Safari UA contains "Chrome")
    if (ua.includes("Safari") && !ua.includes("Chrome")) {
      name = "Safari";
      isSafari = true;
      const match = ua.match(/Version\/(\d+)/);
      if (match !== null) {
        version = match[1] ?? "0";
      }
    }
    // H4 FIX - Edge detection BEFORE Chrome (Edge UA contains both "Chrome" and "Edg")
    else if (ua.includes("Edg")) {
      name = "Edge";
      const match = ua.match(/Edg\/(\d+)/);
      if (match !== null) {
        version = match[1] ?? "0";
      }
    }
    // Chrome detection
    else if (ua.includes("Chrome")) {
      name = "Chrome";
      const match = ua.match(/Chrome\/(\d+)/);
      if (match !== null) {
        version = match[1] ?? "0";
      }
    }
    // Firefox detection
    else if (ua.includes("Firefox")) {
      name = "Firefox";
      const match = ua.match(/Firefox\/(\d+)/);
      if (match !== null) {
        version = match[1] ?? "0";
      }
    }

    return { name, version, isSafari };
  }

  /**
   * Check if browser is recommended for optimal performance
   * @returns True if browser meets recommended versions
   */
  static isRecommendedBrowser(): boolean {
    const { name, version } = this.getBrowserInfo();
    const versionNum = parseInt(version, 10);

    switch (name) {
      case "Chrome":
        return versionNum >= 90;
      case "Firefox":
        return versionNum >= 88;
      case "Safari":
        return versionNum >= 14;
      case "Edge":
        return versionNum >= 90;
      default:
        return false;
    }
  }
}
