import { MulterFile } from 'src/common/types/multer-file.type';

/**
 * Interface defining options for various media processing operations.
 * Provides configuration parameters for different media processing scenarios.
 */
export interface MediaOptions {
  /**
   * Options for image uploads
   */
  upload?: {
    /**
     * Quality of the image compression (1-100)
     * Higher values produce better quality but larger file sizes.
     */
    quality?: number;

    /**
     * Maximum width of the uploaded image in pixels.
     * Images wider than this will be resized.
     */
    maxWidth?: number;

    /**
     * Maximum height of the uploaded image in pixels.
     * Images taller than this will be resized.
     */
    maxHeight?: number;

    /**
     * Folder path on Cloudinary where the image should be stored.
     */
    folder?: string;

    /**
     * Whether to generate a public ID automatically or use a custom one.
     */
    useFilename?: boolean;

    /**
     * Cloudinary transformation options.
     */
    transformation?: any[];

    /**
     * Optional status to tag the uploaded media.
     * Only applies to Member media types.
     */
    status?: 'avatar' | 'label' | 'unknown';
  };

  /**
   * Options for face detection and processing
   */
  faceDetection?: {
    /**
     * Minimum confidence level (0-1) required for face detection.
     * Higher values reduce false positives but might miss some faces.
     */
    minConfidence?: number;

    /**
     * Maximum number of faces to detect in an image.
     */
    maxFaces?: number;

    /**
     * Size in pixels of the face avatar after cropping.
     */
    avatarSize?: number;

    /**
     * Padding factor around detected faces (0-1).
     * Higher values include more of the surrounding area.
     */
    paddingFactor?: number;

    /**
     * Whether to enhance the image before face detection.
     */
    enhanceImage?: boolean;

    /**
     * Whether to process faces in parallel using worker threads.
     */
    useWorkers?: boolean;

    /**
     * Maximum time in milliseconds to wait for face detection.
     */
    timeout?: number;
  };

  /**
   * Options for embedding generation
   */
  embedding?: {
    /**
     * Whether to generate embeddings immediately or schedule for background processing.
     */
    immediate?: boolean;

    /**
     * Similarity threshold for face matching.
     */
    similarityThreshold?: number;

    /**
     * Whether to store the embedding in the database.
     */
    storeEmbedding?: boolean;

     /**
     * Timeout in milliseconds for embedding generation
     */
    timeout?: number;
    
    useWorkers?: boolean;
  };

  /**
   * General processing options
   */
  processing?: {
    /**
     * Priority level for background processing (lower = higher priority).
     */
    priority?: number;

    /**
     * Whether to run the processing synchronously or asynchronously.
     */
    synchronous?: boolean;

    /**
     * Batch size for parallel processing operations.
     */
    batchSize?: number;

    /**
     * Delay in milliseconds between processing batches.
     */
    batchDelay?: number;
  };

  /**
   * Options for file handling
   */
  file?: {
    /**
     * Original file reference for processing operations.
     */
    original?: MulterFile;

    /**
     * Whether to create a deep copy of the file buffer.
     */
    createBufferCopy?: boolean;

    /**
     * Maximum file size in bytes.
     */
    maxSize?: number;

    /**
     * Allowed MIME types.
     */
    allowedTypes?: string[];
  };

  /**
   * Options for searching similar faces
   */
  search?: {
    /**
     * Similarity threshold (0-1) for matching faces
     */
    similarityThreshold?: number;

    /**
     * Maximum number of similar results to return
     */
    maxResults?: number;

    /**
     * Whether to include detailed information about matched faces
     */
    includeDetails?: boolean;
  };
}
