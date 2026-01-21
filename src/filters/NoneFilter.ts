/**
 * NoneFilter - Passthrough filter that doesn't modify the image
 */

import { Filter, validateImageData } from "./Filter";

export class NoneFilter implements Filter {
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);
    // Return the image data unchanged
    return imageData;
  }
}
