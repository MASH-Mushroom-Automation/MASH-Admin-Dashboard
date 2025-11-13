/**
 * Sanitizes and validates image URLs/base64 strings
 * Handles multiple formats: URLs, base64, relative paths
 *
 * @param imageInput - Image URL, base64 string, or relative path
 * @param customFallback - Custom fallback image path
 * @returns Valid image URL or fallback
 */
export const sanitizeImageUrl = (
  imageInput: string | null | undefined,
  customFallback: string = "/defaultImage.png"
): string => {
  // No image provided
  if (!imageInput) {
    console.warn("No image provided, using fallback");
    return customFallback;
  }

  // Handle base64 data URI (data:image/...)
  if (typeof imageInput === "string" && imageInput.startsWith("data:image")) {
    try {
      const base64Data = imageInput.split(",")[1];

      // Validate base64 string
      if (!base64Data) {
        console.error("Invalid base64 data URI format:", imageInput);
        return customFallback;
      }

      atob(base64Data); // Test decode

      // Check for supported MIME types
      if (
        !imageInput.startsWith("data:image/jpeg") &&
        !imageInput.startsWith("data:image/jpg") &&
        !imageInput.startsWith("data:image/png") &&
        !imageInput.startsWith("data:image/gif") &&
        !imageInput.startsWith("data:image/webp")
      ) {
        console.warn(
          "Unsupported MIME type in base64:",
          imageInput.substring(0, 50)
        );
        return customFallback;
      }

      return imageInput;
    } catch (e) {
      console.error("Invalid base64 string:", imageInput.substring(0, 50), e);
      return customFallback;
    }
  }

  // Handle absolute URLs (http://, https://)
  if (
    typeof imageInput === "string" &&
    (imageInput.startsWith("http://") || imageInput.startsWith("https://"))
  ) {
    return imageInput;
  }

  // Handle relative paths from backend API
  if (typeof imageInput === "string" && imageInput.startsWith("/")) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      console.error(
        "NEXT_PUBLIC_API_URL not configured for relative path:",
        imageInput
      );
      return customFallback;
    }
    return `${backendUrl}${imageInput}`;
  }

  // Try to decode as raw base64 (without data URI prefix)
  if (typeof imageInput === "string") {
    try {
      atob(imageInput); // Test if it's valid base64
      return `data:image/jpeg;base64,${imageInput}`;
    } catch (e) {
      console.error(
        "Failed to decode as base64 image:",
        imageInput.substring(0, 50),
        e
      );
      return customFallback;
    }
  }

  // Fallback for unexpected formats
  console.error("Unexpected image format:", typeof imageInput, imageInput);
  return customFallback;
};

/**
 * Extract first image from array of images
 * @param images - Array of image URLs/base64 strings
 * @param customFallback - Custom fallback image
 * @returns Sanitized image URL
 */
export const getFirstImage = (
  images: string[] | null | undefined,
  customFallback?: string
): string => {
  if (!images || images.length === 0) {
    return sanitizeImageUrl(null, customFallback);
  }

  return sanitizeImageUrl(images[0], customFallback);
};
