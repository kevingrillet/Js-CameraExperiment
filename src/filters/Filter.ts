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

/**
 * Validates ImageData before processing
 * @param imageData - The image data to validate
 * @throws Error if validation fails
 */
export function validateImageData(imageData: ImageData): void {
  if (imageData === null || imageData === undefined) {
    throw new Error("ImageData is null or undefined");
  }

  // Note: instanceof check skipped - causes ESLint strict-boolean-expressions error
  // TypeScript type system provides sufficient type safety

  if (imageData.width <= 0 || imageData.height <= 0) {
    throw new Error(
      `Invalid ImageData dimensions: ${imageData.width}x${imageData.height}`
    );
  }

  if (
    imageData.data === null ||
    imageData.data === undefined ||
    imageData.data.length === 0
  ) {
    throw new Error("ImageData has no pixel data");
  }

  const expectedLength = imageData.width * imageData.height * 4;
  if (imageData.data.length !== expectedLength) {
    throw new Error(
      `ImageData size mismatch: expected ${expectedLength}, got ${imageData.data.length}`
    );
  }
}
