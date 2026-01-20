/**
 * PixelateFilter - Creates a Game Boy style pixelated effect
 * Uses 4-color green palette similar to original Game Boy
 * Original Game Boy resolution: 160x144 pixels
 */

import { Filter } from "./Filter";

export class PixelateFilter implements Filter {
  private readonly GB_WIDTH = 160; // Game Boy horizontal resolution
  private readonly GB_HEIGHT = 144; // Game Boy vertical resolution

  // Original Game Boy color palette (darkest to lightest)
  private readonly PALETTE = [
    { r: 15, g: 56, b: 15 }, // #0f380f - Darkest green
    { r: 48, g: 98, b: 48 }, // #306230 - Dark green
    { r: 139, g: 172, b: 15 }, // #8bac0f - Light green
    { r: 155, g: 188, b: 15 }, // #9bbc0f - Lightest green
  ];

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Calculate block size to achieve Game Boy resolution
    const blockWidth = width / this.GB_WIDTH;
    const blockHeight = height / this.GB_HEIGHT;

    // Create a copy for reading original values
    const originalData = new Uint8ClampedArray(data);

    // Process each Game Boy pixel
    for (let gbY = 0; gbY < this.GB_HEIGHT; gbY++) {
      for (let gbX = 0; gbX < this.GB_WIDTH; gbX++) {
        // Calculate the block boundaries in the original image
        const startX = Math.floor(gbX * blockWidth);
        const startY = Math.floor(gbY * blockHeight);
        const endX = Math.floor((gbX + 1) * blockWidth);
        const endY = Math.floor((gbY + 1) * blockHeight);

        // Calculate average color for this block
        let sumR = 0,
          sumG = 0,
          sumB = 0;
        let count = 0;

        for (let y = startY; y < endY && y < height; y++) {
          for (let x = startX; x < endX && x < width; x++) {
            const idx = (y * width + x) * 4;
            sumR += originalData[idx]!;
            sumG += originalData[idx + 1]!;
            sumB += originalData[idx + 2]!;
            count++;
          }
        }

        if (count === 0) {
          continue;
        }

        const avgR = sumR / count;
        const avgG = sumG / count;
        const avgB = sumB / count;

        // Convert to grayscale to determine palette index
        const gray = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

        // Map grayscale to one of 4 colors
        const paletteIndex = Math.floor((gray / 255) * 3.999);
        const color = this.PALETTE[Math.min(paletteIndex, 3)]!;

        // Apply color to entire block in output
        for (let y = startY; y < endY && y < height; y++) {
          for (let x = startX; x < endX && x < width; x++) {
            const idx = (y * width + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
          }
        }
      }
    }

    return imageData;
  }
}
