import sizeOf from 'image-size';

/**
 * Validates image aspect ratio
 * @param buffer Image buffer
 * @param expectedRatio Expected aspect ratio (e.g., 1.91 for LinkedIn-style posts)
 * @param tolerance Acceptable deviation from expected ratio (default: 0.05)
 * @returns Object with validation result and metadata
 */
export const validateImageAspectRatio = async (
  buffer: Buffer,
  expectedRatio: number,
  tolerance: number = 0.05
): Promise<{
  valid: boolean;
  width?: number;
  height?: number;
  aspectRatio?: number;
  error?: string;
}> => {
  try {
    const dimensions = sizeOf(buffer);

    if (!dimensions.width || !dimensions.height) {
      return {
        valid: false,
        error: 'Unable to determine image dimensions',
      };
    }

    const aspectRatio = dimensions.width / dimensions.height;
    const deviation = Math.abs(aspectRatio - expectedRatio);

    return {
      valid: deviation <= tolerance,
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio: parseFloat(aspectRatio.toFixed(2)),
      error:
        deviation > tolerance
          ? `Invalid aspect ratio: ${aspectRatio.toFixed(2)}:1 (expected ${expectedRatio}:1)`
          : undefined,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `Failed to validate image: ${error.message}`,
    };
  }
};

/**
 * Validates poster image for job news posts
 * Professional LinkedIn-style posts: 1.91:1 aspect ratio
 * @param buffer Image buffer
 * @returns Validation result
 */
export const validatePosterImage = async (buffer: Buffer) => {
  const LINKEDIN_RATIO = 1.91; // Professional standard
  return validateImageAspectRatio(buffer, LINKEDIN_RATIO);
};

/**
 * Validates video aspect ratio based on metadata
 * Note: For full video validation, consider using ffprobe or similar tools
 * This is a placeholder for future implementation
 * @param buffer Video buffer
 * @returns Validation result
 */
export const validateVideoAspectRatio = async (
  buffer: Buffer
): Promise<{
  valid: boolean;
  error?: string;
}> => {
  // For now, we'll rely on frontend validation for videos
  // Backend video aspect ratio validation requires ffprobe or similar tools
  // which adds significant complexity

  // Future implementation could use fluent-ffmpeg or @ffprobe-installer/ffprobe
  // to extract video metadata and validate 9:16 (vertical) or 16:9 (horizontal)

  return {
    valid: true, // Trusting frontend validation for now
  };
};

/**
 * Media validation constants
 */
export const MEDIA_CONSTRAINTS = {
  poster: {
    aspectRatio: 1.91,
    tolerance: 0.05,
    maxSize: 10 * 1024 * 1024, // 10MB
    formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    recommendedSizes: ['1200x628', '1920x1005'],
  },
  video: {
    verticalRatio: 9 / 16, // 0.5625
    horizontalRatio: 16 / 9, // 1.7778
    tolerance: 0.05,
    maxSize: 50 * 1024 * 1024, // 50MB
    formats: ['video/mp4', 'video/webm', 'video/quicktime'],
    recommendedSizes: {
      vertical: '1080x1920',
      horizontal: '1920x1080',
    },
  },
} as const;
