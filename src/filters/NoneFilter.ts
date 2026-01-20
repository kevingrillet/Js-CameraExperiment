/**
 * NoneFilter - Passthrough filter that doesn't modify the image
 */

import { Filter } from "./Filter";

export class NoneFilter implements Filter {
  apply(imageData: ImageData): ImageData {
    // Return the image data unchanged
    return imageData;
  }
}
