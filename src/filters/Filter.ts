/**
 * Base Filter interface
 * All filters must implement the apply method to transform ImageData
 */

export interface Filter {
  /**
   * Apply the filter transformation to the given ImageData
   * @param imageData - The input image data to transform
   * @returns The transformed ImageData
   */
  apply(imageData: ImageData): ImageData;

  /**
   * Optional cleanup method called when filter is being replaced
   */
  cleanup?(): void;
}
