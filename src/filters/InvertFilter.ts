/**
 * InvertFilter - Inverts all RGB color values
 */

import { Filter } from "./Filter";

export class InvertFilter implements Filter {
  apply(imageData: ImageData): ImageData {
    const data = imageData.data;

    // Iterate through all pixels
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]!; // Red
      data[i + 1] = 255 - data[i + 1]!; // Green
      data[i + 2] = 255 - data[i + 2]!; // Blue
      // Alpha (i + 3) remains unchanged
    }

    return imageData;
  }
}
