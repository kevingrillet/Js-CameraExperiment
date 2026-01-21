/**
 * Canvas Capture Utility
 * Handles PNG download functionality for canvas elements
 */

import type { FilterType } from "../types";
import { Logger } from "./Logger";

/**
 * Utility class for capturing and downloading canvas content as PNG images
 */
export class CanvasCapture {
  /**
   * Capture canvas content and trigger download as PNG
   * @param canvas - The canvas element to capture
   * @param filename - The filename for the downloaded file
   * @throws Error if canvas.toBlob() fails or quota is exceeded
   */
  static async captureCanvas(
    canvas: HTMLCanvasElement,
    filename: string
  ): Promise<void> {
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob === null) {
            reject(new Error("Canvas toBlob returned null"));
            return;
          }
          resolve(blob);
        }, "image/png");
      });

      this.triggerDownload(blob, filename);
    } catch (error) {
      Logger.error(
        "Canvas capture failed",
        error instanceof Error ? error : new Error(String(error)),
        "CanvasCapture"
      );
      throw error;
    }
  }

  /**
   * Generate filename for downloaded image
   * @param filterType - The current filter type
   * @returns Formatted filename: camera-experiment-{filterType}-{timestamp}.png
   *
   * Note: Uses English filter type names (not translated) for consistency and compatibility.
   * This avoids special characters, maintains cross-platform filename compatibility,
   * and ensures filenames remain readable regardless of UI language.
   */
  static generateFilename(filterType: FilterType): string {
    const timestamp = this.formatTimestamp();
    return `camera-experiment-${filterType}-${timestamp}.png`;
  }

  /**
   * Format current timestamp as YYYYMMDD-HHmmss
   * @returns Formatted timestamp string
   */
  static formatTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Trigger file download using a temporary anchor element
   * @param blob - The blob to download
   * @param filename - The filename for the download
   */
  static triggerDownload(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;

    try {
      a.click();
    } finally {
      // Always cleanup ObjectURL to prevent memory leaks
      URL.revokeObjectURL(objectUrl);
    }
  }
}
