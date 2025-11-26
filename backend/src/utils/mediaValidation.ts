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
 * Supports multiple aspect ratios like LinkedIn: 1.91:1, 1:1, 4:5
 * @param buffer Image buffer
 * @returns Validation result
 */
export const validatePosterImage = async (buffer: Buffer) => {
  const SUPPORTED_RATIOS = [
    { ratio: 1.91, name: 'Landscape (1.91:1)' },
    { ratio: 1, name: 'Square (1:1)' },
    { ratio: 0.8, name: 'Portrait (4:5)' },
  ];
  const TOLERANCE = 0.1;

  try {
    const dimensions = sizeOf(buffer);

    if (!dimensions.width || !dimensions.height) {
      return {
        valid: false,
        error: 'Unable to determine image dimensions',
      };
    }

    // Check minimum width (LinkedIn standard)
    if (dimensions.width < 200) {
      return {
        valid: false,
        width: dimensions.width,
        height: dimensions.height,
        error: 'Image width must be at least 200px',
      };
    }

    const aspectRatio = dimensions.width / dimensions.height;

    // Check if the aspect ratio matches any supported ratio
    const matchedRatio = SUPPORTED_RATIOS.find(
      (r) => Math.abs(aspectRatio - r.ratio) <= TOLERANCE
    );

    if (matchedRatio) {
      return {
        valid: true,
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: parseFloat(aspectRatio.toFixed(2)),
        format: matchedRatio.name,
      };
    }

    return {
      valid: false,
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio: parseFloat(aspectRatio.toFixed(2)),
      error: `Invalid aspect ratio: ${aspectRatio.toFixed(2)}:1. Supported ratios: Landscape (1.91:1), Square (1:1), Portrait (4:5)`,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `Failed to validate image: ${error.message}`,
    };
  }
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
    // Support multiple aspect ratios like LinkedIn
    aspectRatios: [
      { ratio: 1.91, name: 'Landscape', recommended: '1200x628' },
      { ratio: 1, name: 'Square', recommended: '1200x1200' },
      { ratio: 0.8, name: 'Portrait (4:5)', recommended: '1080x1350' },
    ],
    tolerance: 0.1, // Increased tolerance for flexibility
    maxSize: 10 * 1024 * 1024, // 10MB
    minWidth: 200, // LinkedIn minimum
    formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    recommendedSizes: ['1200x628', '1200x1200', '1080x1350'],
  },
  video: {
    // Support multiple aspect ratios like LinkedIn
    aspectRatios: [
      { ratio: 16 / 9, name: 'Landscape (16:9)', recommended: '1920x1080' },
      { ratio: 1, name: 'Square (1:1)', recommended: '1080x1080' },
      { ratio: 4 / 5, name: 'Portrait (4:5)', recommended: '1080x1350' },
      { ratio: 9 / 16, name: 'Vertical (9:16)', recommended: '1080x1920' },
    ],
    tolerance: 0.1,
    maxSize: 200 * 1024 * 1024, // 200MB
    formats: ['video/mp4', 'video/webm', 'video/quicktime'],
    recommendedSizes: ['1920x1080', '1080x1080', '1080x1350', '1080x1920'],
  },
} as const;
