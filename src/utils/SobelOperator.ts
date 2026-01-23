/**
 * SobelOperator - Shared utility for Sobel edge detection
 * Computes horizontal and vertical gradients for edge detection algorithms
 * Used by EdgeDetectionFilter, RotoscopeFilter, and SobelRainbowFilter
 */

/**
 * Compute Sobel gradients (Gx and Gy) for edge detection
 *
 * The Sobel operator uses two 3x3 kernels to approximate image gradients:
 *
 * Sobel X (horizontal edges):      Sobel Y (vertical edges):
 * -1  0  1                          -1 -2 -1
 * -2  0  2                           0  0  0
 * -1  0  1                           1  2  1
 *
 * The gradient magnitude sqrt(Gx² + Gy²) indicates edge strength
 * The gradient direction atan2(Gy, Gx) indicates edge orientation
 *
 * @param data - RGBA pixel data (width × height × 4 bytes)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Object containing Gx and Gy gradient arrays (Float32Array)
 */
export function computeSobelGradients(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { gx: Float32Array; gy: Float32Array } {
  const pixelCount = width * height;
  const gx = new Float32Array(pixelCount);
  const gy = new Float32Array(pixelCount);

  // Process each pixel (skip border - 1px margin)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Get grayscale values of 3x3 neighborhood
      const nw = computeGrayscale(data, (y - 1) * width + (x - 1));
      const n = computeGrayscale(data, (y - 1) * width + x);
      const ne = computeGrayscale(data, (y - 1) * width + (x + 1));
      const w = computeGrayscale(data, y * width + (x - 1));
      const e = computeGrayscale(data, y * width + (x + 1));
      const sw = computeGrayscale(data, (y + 1) * width + (x - 1));
      const s = computeGrayscale(data, (y + 1) * width + x);
      const se = computeGrayscale(data, (y + 1) * width + (x + 1));

      // Apply Sobel X kernel
      gx[idx] = -nw + ne - 2 * w + 2 * e - sw + se;

      // Apply Sobel Y kernel
      gy[idx] = -nw - 2 * n - ne + sw + 2 * s + se;
    }
  }

  return { gx, gy };
}

/**
 * Convert RGB pixel to grayscale using ITU-R BT.601 luminance formula
 * This formula weights green more heavily as human vision is more sensitive to green
 *
 * @param data - RGBA pixel data
 * @param pixelIndex - Pixel index (NOT byte index - will be multiplied by 4)
 * @returns Grayscale value 0-255
 */
function computeGrayscale(data: Uint8ClampedArray, pixelIndex: number): number {
  const byteIndex = pixelIndex * 4;
  // ITU-R BT.601 formula: Y = 0.299*R + 0.587*G + 0.114*B
  return (
    0.299 * data[byteIndex]! +
    0.587 * data[byteIndex + 1]! +
    0.114 * data[byteIndex + 2]!
  );
}
