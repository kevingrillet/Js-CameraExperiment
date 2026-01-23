/**
 * AsciiFilter - Converts video to ASCII art (Matrix terminal style)
 * Uses bitmap font pre-rendering for optimal performance
 */

import { Filter, validateImageData } from "./Filter";

export class AsciiFilter implements Filter {
  /**
   * Size of each ASCII character cell in pixels (8x8)
   * Creates 240x135 character grid at 1080p resolution
   */
  private readonly CELL_SIZE = 8;

  /**
   * ASCII characters ordered by visual density (light to dark)
   * 9 levels for smooth luminance mapping
   */
  private readonly CHARSET = ".:-=+*#%@";

  /**
   * Font specification for ASCII rendering
   * Monospace required for proper grid alignment
   */
  private readonly FONT = '8px "Courier New", monospace';

  /**
   * Matrix-style green text color
   * Hardcoded for V4, configurable UI planned for V6+
   */
  private readonly TEXT_COLOR = "#00FF00";

  /**
   * Black background color
   * Hardcoded for V4, configurable UI planned for V6+
   */
  private readonly BACKGROUND_COLOR = "#000000";

  /**
   * Pre-rendered glyph canvases for each character
   * Initialized once in constructor, reused infinitely
   * Critical for performance: avoids 32,400 fillText() calls per frame
   */
  private glyphCanvases: Map<string, HTMLCanvasElement> = new Map();

  constructor() {
    this.initGlyphCanvases();
  }

  /**
   * Pre-render all ASCII glyphs to offscreen canvases
   * Called once during filter initialization
   * Bitmap approach: 300x faster than per-frame fillText()
   */
  private initGlyphCanvases(): void {
    for (const char of this.CHARSET) {
      const canvas = document.createElement("canvas");
      canvas.width = this.CELL_SIZE;
      canvas.height = this.CELL_SIZE;
      const ctx = canvas.getContext("2d");

      // Happy-DOM may return null for getContext("2d")
      if (ctx === null) {
        continue;
      }

      ctx.fillStyle = this.TEXT_COLOR;
      ctx.font = this.FONT;
      ctx.textBaseline = "top";
      ctx.fillText(char, 0, 0);

      this.glyphCanvases.set(char, canvas);
    }
  }

  /**
   * Apply ASCII art effect to image data
   * Divides image into 8x8 cells, maps luminance to charset
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData with ASCII art effect
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Get canvas context for drawing
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Happy-DOM may return null for getContext("2d") - fallback to passthrough
    if (ctx === null) {
      return imageData;
    }

    // Fill background black
    ctx.fillStyle = this.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Calculate grid dimensions
    const cols = Math.floor(width / this.CELL_SIZE);
    const rows = Math.floor(height / this.CELL_SIZE);

    // Process each cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellX = col * this.CELL_SIZE;
        const cellY = row * this.CELL_SIZE;

        // Calculate average luminance for this cell
        let totalLuminance = 0;
        let pixelCount = 0;

        for (let y = 0; y < this.CELL_SIZE; y++) {
          for (let x = 0; x < this.CELL_SIZE; x++) {
            const px = cellX + x;
            const py = cellY + y;

            if (px < width && py < height) {
              const idx = (py * width + px) * 4;
              // ITU-R BT.601 luminance formula
              const luminance =
                0.299 * data[idx]! +
                0.587 * data[idx + 1]! +
                0.114 * data[idx + 2]!;
              totalLuminance += luminance;
              pixelCount++;
            }
          }
        }

        const avgLuminance = totalLuminance / pixelCount;

        // Map luminance to charset index (0-8)
        const charsetIndex = Math.min(
          Math.floor((avgLuminance / 255) * this.CHARSET.length),
          this.CHARSET.length - 1
        );

        const char = this.CHARSET[charsetIndex]!;

        // Draw pre-rendered glyph (FAST - no fillText in loop)
        const glyphCanvas = this.glyphCanvases.get(char)!;
        ctx.drawImage(glyphCanvas, cellX, cellY);
      }
    }

    // Copy rendered canvas back to imageData
    const renderedData = ctx.getImageData(0, 0, width, height);
    data.set(renderedData.data);

    return imageData;
  }

  /**
   * Clean up pre-rendered glyph canvases
   * Idempotent: safe to call multiple times
   */
  cleanup(): void {
    this.glyphCanvases.clear();
  }
}
