import axios from 'axios';

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE || '';
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '';
const BUNNY_CDN_URL = `https://${process.env.BUNNY_PULL_ZONE}`;
const BUNNY_STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API || '';
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || '';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Bunny Storage
 * @param buffer - File buffer to upload
 * @param filename - Destination filename (include folder path like 'profile-photos/user123.jpg')
 * @param contentType - MIME type of the file (e.g., 'image/jpeg')
 * @returns Upload result with CDN URL
 */
export const uploadToBunny = async (
  buffer: Buffer,
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> => {
  try {
    const url = `${BUNNY_STORAGE_URL}/${filename}`;

    const response = await axios.put(url, buffer, {
      headers: {
        AccessKey: BUNNY_API_KEY,
        'Content-Type': contentType,
      },
    });

    if (response.status === 201 || response.status === 200) {
      return {
        success: true,
        url: `${BUNNY_CDN_URL}/${filename}`,
      };
    }

    return {
      success: false,
      error: 'Upload failed',
    };
  } catch (error: any) {
    console.error('Bunny upload error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
};

/**
 * Delete a file from Bunny Storage
 * @param filename - Filename to delete (include folder path)
 * @returns Success status
 */
export const deleteFromBunny = async (filename: string): Promise<boolean> => {
  try {
    const url = `${BUNNY_STORAGE_URL}/${filename}`;

    const response = await axios.delete(url, {
      headers: {
        AccessKey: BUNNY_API_KEY,
      },
    });

    return response.status === 200 || response.status === 204;
  } catch (error: any) {
    console.error('Bunny delete error:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Extract filename from Bunny CDN URL
 * @param cdnUrl - Full CDN URL
 * @returns Filename/path or null
 */
export const extractFilenameFromUrl = (cdnUrl: string): string | null => {
  try {
    const url = new URL(cdnUrl);
    // Remove leading slash
    return url.pathname.substring(1);
  } catch (error) {
    return null;
  }
};

/**
 * Generate unique filename for profile photo
 * @param userId - User ID
 * @param originalExtension - File extension (e.g., 'jpg', 'png')
 * @returns Filename with path
 */
export const generateProfilePhotoFilename = (
  userId: string,
  originalExtension: string
): string => {
  const timestamp = Date.now();
  return `profile-photos/${userId}-${timestamp}.${originalExtension}`;
};

/**
 * Generate unique filename for resume
 * @param userId - User ID
 * @param originalExtension - File extension (e.g., 'pdf', 'docx')
 * @returns Filename with path
 */
export const generateResumeFilename = (
  userId: string,
  originalExtension: string
): string => {
  const timestamp = Date.now();
  return `resumes/${userId}-${timestamp}.${originalExtension}`;
};

/**
 * Generate unique filename for job news poster
 * @param userId - User ID
 * @param originalExtension - File extension (e.g., 'jpg', 'png')
 * @returns Filename with path
 */
export const generatePosterFilename = (
  userId: string,
  originalExtension: string
): string => {
  const timestamp = Date.now();
  return `job-news-posters/${userId}-${timestamp}.${originalExtension}`;
};

/**
 * Generate unique filename for offer letter
 * @param applicationId - Application ID
 * @param originalFilename - Original file name
 * @returns Filename with path
 */
export const generateOfferLetterFilename = (
  applicationId: string,
  originalFilename: string
): string => {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop() || 'pdf';
  return `offer-letters/${applicationId}-${timestamp}.${extension}`;
};

/**
 * Generate unique filename for company logo
 * @param companyId - Company ID
 * @param originalExtension - File extension (e.g., 'jpg', 'png')
 * @returns Filename with path
 */
export const generateCompanyLogoFilename = (
  companyId: string,
  originalExtension: string
): string => {
  const timestamp = Date.now();
  return `company-logos/${companyId}-${timestamp}.${originalExtension}`;
};

interface VideoUploadResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  aspectRatio?: string;
  error?: string;
}

interface VideoMetadata {
  width?: number;
  height?: number;
  aspectRatio?: string;
}

/**
 * Get video metadata from Bunny Stream
 * @param videoId - Video ID (GUID)
 * @returns Video metadata including dimensions
 */
export const getVideoMetadata = async (videoId: string): Promise<VideoMetadata | null> => {
  try {
    const response = await axios.get(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          AccessKey: BUNNY_STREAM_API_KEY,
        },
      }
    );

    const { width, height } = response.data;

    if (width && height) {
      // Determine aspect ratio based on dimensions
      const ratio = width / height;
      let aspectRatio = '16:9'; // default

      if (Math.abs(ratio - 1) < 0.1) {
        aspectRatio = '1:1';
      } else if (Math.abs(ratio - 0.8) < 0.1) {
        aspectRatio = '4:5';
      } else if (Math.abs(ratio - 0.5625) < 0.1) {
        aspectRatio = '9:16';
      } else if (Math.abs(ratio - 1.7778) < 0.1) {
        aspectRatio = '16:9';
      }

      return { width, height, aspectRatio };
    }

    return null;
  } catch (error: any) {
    console.error('Error getting video metadata:', error.message);
    return null;
  }
};

/**
 * Upload video to Bunny Stream
 * @param buffer - Video buffer
 * @param title - Video title
 * @param clientAspectRatio - Optional aspect ratio from client-side detection
 * @returns Upload result with video ID, URL, and aspect ratio
 */
export const uploadVideoToBunnyStream = async (
  buffer: Buffer,
  title: string,
  clientAspectRatio?: string
): Promise<VideoUploadResult> => {
  try {
    console.log('Uploading video to Bunny Stream:', { title, bufferSize: buffer.length });
    console.log('Bunny Stream Config:', {
      libraryId: BUNNY_STREAM_LIBRARY_ID,
      hasApiKey: !!BUNNY_STREAM_API_KEY
    });

    // Create video entry first
    const createResponse = await axios.post(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`,
      { title },
      {
        headers: {
          AccessKey: BUNNY_STREAM_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const videoId = createResponse.data.guid;
    console.log('Video entry created:', videoId);

    // Upload video file
    await axios.put(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
      buffer,
      {
        headers: {
          AccessKey: BUNNY_STREAM_API_KEY,
          'Content-Type': 'application/octet-stream',
        },
      }
    );

    console.log('Video file uploaded successfully');

    // Video URL format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
    const videoUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${videoId}`;

    // Use client-provided aspect ratio (detected during upload)
    // Bunny takes time to process video, so we trust the client-side detection
    const aspectRatio = clientAspectRatio || '16:9';

    return {
      success: true,
      videoId,
      videoUrl,
      aspectRatio,
    };
  } catch (error: any) {
    console.error('Bunny Stream upload error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Video upload failed',
    };
  }
};

/**
 * Delete video from Bunny Stream
 * @param videoId - Video ID (GUID)
 * @returns Success status
 */
export const deleteVideoFromBunnyStream = async (videoId: string): Promise<boolean> => {
  try {
    const response = await axios.delete(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          AccessKey: BUNNY_STREAM_API_KEY,
        },
      }
    );

    return response.status === 200 || response.status === 204;
  } catch (error: any) {
    console.error('Bunny Stream delete error:', error.response?.data || error.message);
    return false;
  }
};
