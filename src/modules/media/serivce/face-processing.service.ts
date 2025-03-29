import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { MulterFile } from 'src/common/types/multer-file.type';
import { WorkerPoolService } from './worker-pool.service';
import { QueueManagerService } from './queue-manager.service';
import { MediaUploadService } from './media-upload.service';
import { MediaRepository } from '../repository/media.repository';
import { MediaMapper } from '../mapper/media.mapper';
import { FaceDetectionService } from 'src/modules/ai-face-detection/service/face-detection.service';
import { FaceEmbeddingService } from 'src/modules/facial-search/service/face-embedding.service';
import { Media } from '../schema/media.schema';
import { MediaOptions } from '../interfaces/media-options.interface';
import { winstonLogger as logger } from 'src/common/winston-logger';
import * as path from 'path';
import { FacialSearchService } from 'src/modules/facial-search/service/facial-search.service';

/**
 * Service responsible for processing face images using worker threads
 * and managing the face detection and embedding generation pipeline.
 * OPTIMIZED for better performance with large batches.
 */
@Injectable()
export class FaceProcessingService {
  private faceDetectionWorkerPath: string;
  private embeddingWorkerPath: string;
  
  // Worker pool configurations
  private readonly MAX_DETECTION_WORKERS = 4;
  private readonly MAX_EMBEDDING_WORKERS = 3;
  
  // Default face detection options - Optimized values
  private readonly defaultDetectionOptions = {
    minConfidence: 0.5,
    maxFaces: 10,
    avatarSize: 600,
    paddingFactor: 0.6,
    enhanceImage: true,
    useWorkers: true,
    timeout: 45000 // Slightly increased timeout for better reliability
  };

  // Cache to avoid redundant embedding generation
  private embeddingProcessingCache = new Set<string>();

  constructor(
    private readonly workerPoolService: WorkerPoolService,
    private readonly queueManagerService: QueueManagerService,
    private readonly mediaUploadService: MediaUploadService,
    private readonly mediaRepository: MediaRepository,
    private readonly faceDetectionService: FaceDetectionService,
    @Inject(forwardRef(() => FaceEmbeddingService))
    private readonly faceEmbeddingService: FaceEmbeddingService,
    @Inject(forwardRef(() => FacialSearchService))
    private readonly facialSearchService: FacialSearchService
  ) {
    // Initialize worker script paths
    this.faceDetectionWorkerPath = path.resolve(process.cwd(), 'dist/modules/media/workers/face-detection.worker.js');
    this.embeddingWorkerPath = path.resolve(process.cwd(), 'dist/modules/media/workers/embedding.worker.js');
    
    // Configure queue manager for better throughput
    this.configureQueueManager();
    
    logger.info(`Face processing service initialized with worker paths:`);
    logger.info(`- Face detection: ${this.faceDetectionWorkerPath}`);
    logger.info(`- Embedding: ${this.embeddingWorkerPath}`);
  }

  /**
   * Configure queue manager for optimal performance
   */
  private configureQueueManager(): void {
    // Set optimal concurrency based on CPU availability
    const cpuCount = require('os').cpus().length;
    const maxConcurrent = Math.max(3, Math.min(cpuCount - 1, 6));
    
    try {
      this.queueManagerService.setMaxConcurrentTasks(maxConcurrent);
      logger.info(`Set queue manager concurrency to ${maxConcurrent} tasks`);
    } catch (error) {
      logger.warn(`Failed to set max concurrent tasks: ${error.message}`);
    }
  }

  /**
   * Process and upload avatar with background face detection
   * This method provides a fast response by immediately returning a placeholder
   * and then processing the faces in the background
   * 
   * @param file The uploaded file
   * @param ownerId The owner ID (usually member ID)
   * @param options Optional processing options
   */
  async processAndUploadAvatar(
    file: MulterFile,
    ownerId: string,
    options?: MediaOptions
  ): Promise<{ faceId: string; previewUrl: string; status: 'unknown' }[]> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    try {
      logger.http(`Processing avatar for Member ID: ${ownerId}`);
      
      // OPTIMIZATION: Apply quick initial pre-processing to reduce file size for upload
      const optimizedFile = await this.quickOptimizeImage(file, options);
      
      // Directly upload original file to Cloudinary for immediate response
      const initialUpload = await this.mediaUploadService.uploadFile(
        optimizedFile, 
        ownerId, 
        'Member'
      );
      
      // Generate a placeholder response with the original image
      const placeholderResponse = [{
        faceId: initialUpload.mediaId,
        previewUrl: initialUpload.url,
        status: 'unknown' as const
      }];
      
      // Schedule background face detection and processing with high priority
      this.scheduleBackgroundFaceProcessing(optimizedFile, ownerId, initialUpload, options);
      
      return placeholderResponse;
    } catch (error) {
      logger.error(`❌ Avatar upload error: ${error.message}`);
      throw new BadRequestException(`Failed to upload avatar: ${error.message}`);
    }
  }

  /**
   * OPTIMIZATION: Quick image optimization before uploading
   * Reduces file size without full preprocessing pipeline
   */
  private async quickOptimizeImage(file: MulterFile, options?: MediaOptions): Promise<MulterFile> {
    try {
      // Skip optimization for small files (< 100KB)
      if (file.size < 100 * 1024) {
        return file;
      }
  
      // Skip if not a supported image type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        return file;
      }
  
      // Import sharp dynamically and handle CommonJS structure
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default || sharpModule;
  
      // Quick resize and compression
      const processed = await sharp(file.buffer)
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
  
      return {
        ...file,
        buffer: processed,
        size: processed.length
      };
    } catch (error) {
      logger.warn(`Quick image optimization failed: ${error.message}`);
      return file;
    }
  }
  

  /**
   * Schedule background processing for face detection
   * This method adds a task to the background queue to detect faces
   * and generate embeddings without blocking the main thread
   * 
   * @param file The uploaded file
   * @param ownerId The owner ID (usually member ID)
   * @param initialUpload The initial upload result
   * @param options Optional processing options
   */
  scheduleBackgroundFaceProcessing(
    file: MulterFile, 
    ownerId: string, 
    initialUpload: any,
    options?: MediaOptions
  ): void {
    // OPTIMIZATION: Use a shared buffer to avoid duplication
    const fileBufferCopy = Buffer.from(file.buffer);
    
    // Add the face detection task to our background queue with high priority
    this.queueManagerService.addToBackgroundQueue(async () => {
      try {
        // Record start time for performance monitoring
        const startTime = Date.now();
        
        // Create a file copy with the buffer copy
        const fileCopy = {
          ...file,
          buffer: fileBufferCopy
        };
        
        // 1. Detect faces using worker thread (parallel processing)
        logger.info(`Starting background face detection for member ${ownerId}`);
        let detectedFaces;
        
        // OPTIMIZATION: Always default to workers with fallback
        const useWorkers = options?.faceDetection?.useWorkers !== false; // Default to true
        
        try {
          if (useWorkers) {
            // OPTIMIZATION: Improved worker-based detection with better error handling
            detectedFaces = await this.processFacesWithWorker(fileCopy, ownerId, options);
          } else {
            // Use regular detection service
            detectedFaces = await this.faceDetectionService.detectAndCropFaces(fileCopy);
          }
        } catch (detectionError) {
          const timeoutValue = options?.faceDetection?.timeout || this.defaultDetectionOptions.timeout;
          
          if (detectionError.message?.includes('timed out')) {
            logger.warn(`⚠️ Face detection worker timed out after ${timeoutValue}ms — falling back to direct detection.`);
          } else {
            logger.warn(`Face detection error: ${detectionError.message} — falling back to direct detection.`);
          }
        
          // Fallback to regular detection with robust error handling
          try {
            detectedFaces = await this.faceDetectionService.detectAndCropFaces(fileCopy);
          } catch (fallbackError) {
            logger.error(`Even fallback face detection failed: ${fallbackError.message}`);
            
            // Final fallback - use original image if all detection methods fail
            return this.handleNoFacesDetected(fileCopy, ownerId, initialUpload);
          }
        }
        
        const detectionTime = Date.now() - startTime;
        
        // Handle case where no faces were detected
        if (!detectedFaces || detectedFaces.length === 0) {
          logger.warn(`No faces detected for member ${ownerId}, using original image (took ${detectionTime}ms)`);
          return this.handleNoFacesDetected(fileCopy, ownerId, initialUpload);
        }
        
        logger.info(`Detected ${detectedFaces.length} face(s) for member ${ownerId} (took ${detectionTime}ms)`);
        
        // OPTIMIZATION: Process faces with improved parallelism
        const savedMedia = await this.processMultipleFacesInParallel(detectedFaces, fileCopy, ownerId, options);
        
        // OPTIMIZATION: Group embedding generation for better throughput
        if (savedMedia.length > 0) {
          const embeddingQueue = savedMedia.map(media => ({
            mediaId: String(media.mediaId),
            memberId: ownerId
          }));
          
          // Schedule all embeddings together with medium priority
          this.queueManagerService.addToBackgroundQueue(async () => {
            await this.processEmbeddingQueue(embeddingQueue, options);
          }, 15);
        }
        
        logger.info(`Completed face processing for member ${ownerId} in ${Date.now() - startTime}ms`);
        
        // OPTIMIZATION: Clear buffer to help garbage collection
        // @ts-ignore
        detectedFaces = null;
        
      } catch (error) {
        logger.error(`Background face processing error: ${error.message}`);
      }
    }, 5); // Higher priority (5) for face detection
  }

  /**
   * OPTIMIZATION: Handle the case where no faces were detected
   * Extracted to a separate method to reduce code duplication
   */
  private async handleNoFacesDetected(
    file: MulterFile,
    ownerId: string,
    initialUpload: any
  ): Promise<void> {
    try {
      // Create a record with the original image as avatar
      const mediaEntity = MediaMapper.toEntityFromFile({
        ownerId,
        ownerType: 'Member',
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: initialUpload.url,
        status: 'avatar' // Set as avatar since it's the only image
      });
      
      const savedMedia = await this.mediaRepository.create(mediaEntity);
      
      // Schedule embedding generation with lower priority
      this.queueManagerService.addToBackgroundQueue(async () => {
        try {
          // Avoid duplicate processing by checking the cache
          const cacheKey = `embedding:${savedMedia.mediaId}`;
          if (this.embeddingProcessingCache.has(cacheKey)) {
            logger.info(`Embedding generation for media ${savedMedia.mediaId} already in progress, skipping`);
            return;
          }
          
          this.embeddingProcessingCache.add(cacheKey);
          
          try {
            await this.facialSearchService.generateEmbeddingForMember(
              String(savedMedia.mediaId), 
              ownerId
            );
            logger.info(`✅ Generated embedding for original image, member ${ownerId}`);
          } finally {
            // Remove from cache when done or on error
            this.embeddingProcessingCache.delete(cacheKey);
          }
        } catch (err) {
          logger.error(`Failed to generate embedding: ${err.message}`);
        }
      }, 20); // Lower priority (20)
    } catch (error) {
      logger.error(`Error handling no faces case: ${error.message}`);
    }
  }

  /**
   * Process faces with a worker thread
   * This method offloads face detection to a separate thread for better performance
   * 
   * @param file The file to process
   * @param ownerId The owner ID
   * @param options Optional processing options
   * @returns Array of detected faces with buffers
   */
  async processFacesWithWorker(
    file: MulterFile,
    ownerId: string,
    options?: MediaOptions
  ): Promise<any[]> {
    // OPTIMIZATION: Use default timeout for better reliability
    const timeout = options?.faceDetection?.timeout || this.defaultDetectionOptions.timeout;
  
    return new Promise((resolve, reject) => {
      // OPTIMIZATION: Prepare options with defaults for any missing values
      const detectionOptions = {
        minConfidence: options?.faceDetection?.minConfidence || this.defaultDetectionOptions.minConfidence,
        maxFaces: options?.faceDetection?.maxFaces || this.defaultDetectionOptions.maxFaces,
        avatarSize: options?.faceDetection?.avatarSize || this.defaultDetectionOptions.avatarSize,
        paddingFactor: options?.faceDetection?.paddingFactor || this.defaultDetectionOptions.paddingFactor,
        enhanceImage: options?.faceDetection?.enhanceImage !== false,
      };
      
      const payload = {
        fileBuffer: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        ownerId,
        options: detectionOptions
      };
  
      // Set timeout to cancel the operation if it takes too long
      const timeoutId = setTimeout(() => {
        reject(new Error(`Face detection worker timed out after ${timeout / 1000} seconds`));
      }, timeout);
  
      // OPTIMIZATION: Set worker category for better pool management
      this.workerPoolService.runTaskWithWorker(
        this.faceDetectionWorkerPath,
        payload,
        'face-detection',
        timeout
      ).then(result => {
        clearTimeout(timeoutId);
        resolve(result as any[]);
      }).catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }
  

  /**
   * Process multiple faces in parallel batches
   * This method uploads and saves multiple faces efficiently
   * 
   * @param detectedFaces Array of detected faces from the worker
   * @param file Original file reference
   * @param ownerId The owner ID
   * @param options Optional processing options
   * @returns Array of saved media records
   */
  async processMultipleFacesInParallel(
    detectedFaces: any[],
    file: MulterFile,
    ownerId: string,
    options?: MediaOptions
  ): Promise<Media[]> {
    // OPTIMIZATION: Use dynamic batch sizing based on face count
    const results: Media[] = [];
    
    // OPTIMIZATION: Better batch size calculation for increased throughput
    const batchSize = this.calculateOptimalBatchSize(detectedFaces.length, options);
    
    for (let i = 0; i < detectedFaces.length; i += batchSize) {
      const batch = detectedFaces.slice(i, i + batchSize);
      
      // OPTIMIZATION: Process batch with intelligent prioritization
      // First face is likely the most important (main face)
      const firstFace = batch[0];
      const otherFaces = batch.slice(1);
      
      // Process first face with higher priority
      const firstFacePromise = this.processSingleFace(firstFace, file, ownerId, 0, options);
      
      // Process remaining faces in parallel
      const otherFacesPromises = otherFaces.map((face, index) => 
        this.processSingleFace(face, file, ownerId, i + index + 1, options)
      );
      
      // Wait for all faces in batch to process
      const [firstResult, ...otherResults] = await Promise.all([
        firstFacePromise,
        ...otherFacesPromises
      ]);
      
      // Collect valid results (non-null) and add to results array
      if (firstResult) results.push(firstResult);
      results.push(...(otherResults.filter((result): result is Media => result !== null)));
      
      // OPTIMIZATION: Dynamic delay between batches based on system load
      if (i + batchSize < detectedFaces.length) {
        const queueStats = this.queueManagerService.getQueueStats();
        const queueLoad = queueStats.queuedTasks + queueStats.activeTasks;
        
        // Calculate delay based on current system load
        const delay = Math.min(
          Math.max(50, queueLoad * 10), // Base delay proportional to queue load
          options?.processing?.batchDelay || 100 // Cap at configured delay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  /**
   * OPTIMIZATION: Calculate optimal batch size based on system conditions
   */
  private calculateOptimalBatchSize(faceCount: number, options?: MediaOptions): number {
    // Get configured batch size or use default
    const configuredBatchSize = options?.processing?.batchSize || 
      (faceCount > 5 ? 2 : 3); // Smaller batches for many faces
    
    // Get current system load from queue manager
    const queueStats = this.queueManagerService.getQueueStats();
    const systemLoad = queueStats.activeTasks / (this.queueManagerService.getMaxConcurrentTasks() || 3);
    
    // Under high load, reduce batch size
    if (systemLoad > 0.8) {
      return Math.max(1, configuredBatchSize - 1);
    }
    
    // Under low load, can increase batch size
    if (systemLoad < 0.3 && faceCount <= 3) {
      return configuredBatchSize + 1;
    }
    
    return configuredBatchSize;
  }

  /**
   * Process a single face
   * This method uploads and saves a single face
   * 
   * @param face The face data with buffer
   * @param file Original file reference
   * @param ownerId The owner ID
   * @param index The face index (for multiple faces)
   * @param options Optional processing options
   * @returns Saved media record or null on error
   */
  async processSingleFace(
    face: any, 
    file: MulterFile, 
    ownerId: string, 
    index: number,
    options?: MediaOptions
  ): Promise<Media | null> {
    try {
      // OPTIMIZATION: Generate a more unique ID to prevent collisions
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000);
      const faceId = `${ownerId}_face_${index}_${timestamp}_${randomSuffix}`;
      
      // Skip processing if there's no face buffer
      if (!face.faceBuffer || face.faceBuffer.length === 0) {
        logger.warn(`Empty face buffer for face #${index}, skipping`);
        return null;
      }
      
      // OPTIMIZATION: Apply quick compression before upload for faces
      let faceBuffer = face.faceBuffer;
      
      try {
        if (face.faceBuffer.length > 50000) { // Only compress if > 50KB
          const sharp = (await import('sharp')).default;
          faceBuffer = await sharp(face.faceBuffer)
            .jpeg({ quality: 85 })
            .toBuffer();
        }
      } catch (compressError) {
        logger.warn(`Failed to compress face image: ${compressError.message}`);
        faceBuffer = face.faceBuffer;
      }
      
      // Upload face to Cloudinary
      const faceUpload = await this.mediaUploadService.uploadFile(
        {
          ...file,
          buffer: faceBuffer,
          mimetype: 'image/jpeg', // OPTIMIZATION: Always use jpeg for consistent handling
          originalname: `face_${faceId}.jpg`,
          size: faceBuffer.length
        },
        ownerId,
        'Member',
        options
      );
      
      // Determine status based on index
      // First face is avatar, others are labeled
      const status = index === 0 ? 'avatar' : 'label';
      
      // Update the status to reflect avatar or label
      const updatedMedia = await this.mediaRepository.update(faceUpload.mediaId, { status });
      
      return updatedMedia;
    } catch (error) {
      logger.error(`Error processing face ${index}: ${error.message}`);
      return null;
    }
  }

  /**
   * Process a queue of embeddings
   * This method generates embeddings for multiple faces in parallel batches
   * 
   * @param queue Array of media and member IDs to process
   * @param options Optional processing options
   */
  async processEmbeddingQueue(
    queue: { mediaId: string; memberId: string }[],
    options?: MediaOptions
  ): Promise<void> {
    if (!queue || queue.length === 0) return;
    
    // OPTIMIZATION: Dynamic batch size based on queue length
    const batchSize = this.calculateEmbeddingBatchSize(queue.length, options);
    
    // OPTIMIZATION: Track processed items to avoid duplicates
    const processedMediaIds = new Set<string>();
    
    // OPTIMIZATION: Prioritize queue processing - most important first
    // OPTIMIZATION: Pre-fetch all media items to avoid multiple DB calls
    const mediaMap = new Map<string, Media>();
    await Promise.all(
      queue.map(async (item) => {
        const media = await this.mediaRepository.findById(item.mediaId);
        if (media) {
          mediaMap.set(item.mediaId, media);
        }
      })
    );

    const prioritizedQueue = [...queue].sort((a, b) => {
      const mediaA = mediaMap.get(a.mediaId);
      const mediaB = mediaMap.get(b.mediaId);
      
      if (mediaA && mediaB) {
        return (mediaA.status === 'avatar' ? -1 : 1) - (mediaB.status === 'avatar' ? -1 : 1);
      }
      return 0;
    });
    
    for (let i = 0; i < prioritizedQueue.length; i += batchSize) {
      const batch = prioritizedQueue.slice(i, i + batchSize);
      
      // OPTIMIZATION: Process batch with deduplication
      const dedupedBatch = batch.filter(item => !processedMediaIds.has(item.mediaId));
      
      // Skip empty batches
      if (dedupedBatch.length === 0) continue;
      
      // Process batch in parallel
      await Promise.all(dedupedBatch.map(async ({ mediaId, memberId }) => {
        try {
          // Add to processing cache to prevent duplicate processing
          const cacheKey = `embedding:${mediaId}`;
          if (this.embeddingProcessingCache.has(cacheKey)) {
            logger.info(`Embedding generation for media ${mediaId} already in progress, skipping`);
            return;
          }
          
          this.embeddingProcessingCache.add(cacheKey);
          processedMediaIds.add(mediaId);
          
          try {
            // OPTIMIZATION: Use worker-based embedding generation more often
            const useWorker = options?.embedding?.useWorkers !== false; // Default to true
            await this.generateEmbedding(mediaId, memberId, useWorker, options);
            
            logger.info(`✅ Generated embedding for media ${mediaId}, member ${memberId}`);
          } finally {
            // Remove from cache when done or on error
            this.embeddingProcessingCache.delete(cacheKey);
          }
        } catch (error) {
          logger.warn(`⚠️ Failed to generate embedding for media ${mediaId}: ${error.message}`);
        }
      }));
      
      // OPTIMIZATION: Dynamic delay between batches based on system load
      if (i + batchSize < prioritizedQueue.length) {
        const queueStats = this.queueManagerService.getQueueStats();
        const queueLoad = queueStats.queuedTasks + queueStats.activeTasks;
        
        // Calculate delay based on current system load
        const delay = Math.min(
          Math.max(20, queueLoad * 5), // Base delay proportional to queue load
          options?.processing?.batchDelay || 50 // Cap at configured delay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * OPTIMIZATION: Calculate optimal embedding batch size
   */
  private calculateEmbeddingBatchSize(queueLength: number, options?: MediaOptions): number {
    // Default batch size from options
    const configuredBatchSize = options?.processing?.batchSize || 3;
    
    // Adjust based on queue length - smaller batches for large queues
    if (queueLength > 10) {
      return Math.max(1, configuredBatchSize - 1);
    }
    
    // Small queue can use larger batches
    if (queueLength <= 3) {
      return configuredBatchSize + 1;
    }
    
    return configuredBatchSize;
  }

  /**
   * Generate embedding for a single face
   * This method can use either direct or worker-based embedding generation
   * 
   * @param mediaId The media ID
   * @param memberId The member ID
   * @param useWorker Whether to use a worker thread
   * @param options Optional processing options
   */
  async generateEmbedding(
    mediaId: string,
    memberId: string,
    useWorker: boolean = true,
    options?: MediaOptions
  ): Promise<boolean> {
    try {
      logger.info(`Generating embedding for media ID: ${mediaId}, member ID: ${memberId}`);
      
      // Get the media item
      const media = await this.mediaRepository.findById(mediaId);
      if (!media) {
        logger.warn(`Media with ID ${mediaId} not found`);
        return false;
      }
      
      // OPTIMIZATION: Check if embedding already exists to avoid redundant processing
      const existingEmbedding = await this.facialSearchService.getExistingEmbedding(mediaId);
      if (existingEmbedding) {
        logger.info(`Embedding already exists for media ID ${mediaId}, skipping generation`);
        return true;
      }
      
      // Download the image
      const imageBuffer = await this.mediaUploadService.downloadMediaFromUrl(media.url);
      
      if (!imageBuffer || imageBuffer.length === 0) {
        logger.warn(`Failed to download image for media ID ${mediaId}`);
        return false;
      }
      
      // Generate embedding based on chosen method
      if (useWorker) {
        return await this.generateEmbeddingWithWorker(imageBuffer, mediaId, memberId, options);
      } else {
        return await this.generateEmbeddingDirect(imageBuffer, mediaId, memberId, options);
      }
    } catch (error) {
      logger.error(`Error generating embedding: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Generate embedding using a worker thread
   * 
   * @private
   * @param imageBuffer The image buffer
   * @param mediaId The media ID
   * @param memberId The member ID
   * @param options Optional processing options
   */
  private async generateEmbeddingWithWorker(
    imageBuffer: Buffer,
    mediaId: string,
    memberId: string,
    options?: MediaOptions
  ): Promise<boolean> {
    try {
      // OPTIMIZATION: Set a worker timeout
      const timeout = options?.embedding?.timeout || 30000; // 30 seconds default
      
      // Define expected result structure
      interface FaceDetectionResult {
        faceDescriptor: Float32Array;
      }
  
      // Use worker pool to generate embedding with timeout
      const result = await Promise.race([
        // Worker task
        this.workerPoolService.runTaskWithWorker(
          this.embeddingWorkerPath,
          {
            imageBuffer,
            mediaId,
            memberId,
            options: {
              similarityThreshold: options?.embedding?.similarityThreshold || 0.65,
              storeEmbedding: options?.embedding?.storeEmbedding !== false // Default true
            }
          },
          'embedding-generation', // OPTIMIZATION: Categorize worker for better pool management
          timeout
        ),
        
        // Timeout promise
        new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error(`Embedding worker timed out after ${timeout}ms`)), timeout);
        })
      ]) as FaceDetectionResult;
  
      // Handle result
      if (result && result.faceDescriptor) {
        // Store the embedding as number[]
        const success = await this.facialSearchService.storeEmbeddingForMember(
          mediaId,
          memberId,
          Array.from(result.faceDescriptor)
        );
  
        logger.info(`✅ Successfully generated and stored embedding for media ID: ${mediaId}`);
        return success;
      } else {
        logger.warn(`No valid embedding generated for media ID: ${mediaId}`);
        return false;
      }
    } catch (error) {
      // OPTIMIZATION: Fall back to direct method if worker fails
      logger.warn(`Error generating embedding with worker: ${error.message}. Falling back to direct method.`);
      return this.generateEmbeddingDirect(imageBuffer, mediaId, memberId, options);
    }
  }
  
  
  /**
   * Generate embedding directly (fallback method)
   * 
   * @private
   * @param imageBuffer The image buffer
   * @param mediaId The media ID
   * @param memberId The member ID
   * @param options Optional processing options
   */
  private async generateEmbeddingDirect(
    imageBuffer: Buffer,
    mediaId: string,
    memberId: string,
    options?: MediaOptions
  ): Promise<boolean> {
    try {
      // Create a MulterFile-like object for the embedding service
      const file: MulterFile = {
        buffer: imageBuffer,
        originalname: `embedding_${mediaId}.png`,
        mimetype: 'image/png',
        size: imageBuffer.length,
        fieldname: 'file',
        encoding: '7bit',
      };
      
      // OPTIMIZATION: Set timeout for direct extraction
      const startTime = Date.now();
      const timeout = options?.embedding?.timeout || 30000;
      
      // Extract embedding with timeout protection
      const embeddingPromise = this.faceEmbeddingService.extractFaceEmbedding(file);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Direct embedding timed out after ${timeout}ms`)), timeout);
      });
      
      // Race the embedding extraction against timeout
      const embeddingResult = await Promise.race([embeddingPromise, timeoutPromise]);
      
      if (!embeddingResult.success || !embeddingResult.faceDescriptor) {
        logger.warn(`Could not extract face embedding from media ID: ${mediaId}`);
        return false;
      }
      
      // OPTIMIZATION: Add processing time logging
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        logger.warn(`Face embedding extraction took ${duration}ms for media ID: ${mediaId}`);
      }
      
      // Store the embedding
      const success = await this.facialSearchService.storeEmbeddingForMember(
        mediaId,
        memberId,
        Array.from(embeddingResult.faceDescriptor)
      );
      
      logger.info(`✅ Successfully generated and stored embedding for media ID: ${mediaId}`);
      return success;
    } catch (error) {
      logger.error(`Error generating embedding directly: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify and finalize face processing after user confirmation
   * This method processes verified faces and generates embeddings
   * 
   * @param verifiedFaces Array of verified face information
   * @param options Optional processing options
   * @returns Array of processed media items
   */
  async verifyAndProcessFaces(
    verifiedFaces: { faceId: string; memberId: string; status: 'avatar' | 'label' | 'unknown' }[],
    options?: MediaOptions
  ): Promise<Media[]> {
    if (!verifiedFaces || verifiedFaces.length === 0) {
      throw new BadRequestException('No verified faces provided.');
    }
  
    try {
      logger.http(`Processing ${verifiedFaces.length} verified faces`);
  
      // OPTIMIZATION: Process deletions and status updates in parallel
      // Group faces by status
      const facesByStatus = {
        unknown: verifiedFaces.filter(face => face.status === 'unknown'),
        process: verifiedFaces.filter(face => face.status === 'avatar' || face.status === 'label')
      };
      
        const unknownOnly = facesByStatus.unknown
    .filter(face => face.status === 'unknown') as { faceId: string; memberId: string; status: 'unknown' }[];

    const deletePromise = unknownOnly.length > 0 
      ? this.mediaUploadService.deleteUnknownFaces(unknownOnly)
      : Promise.resolve();


      
      let processedFaces: Media[] = [];
      
      // Only process faces that need to be kept
      if (facesByStatus.process.length > 0) {
        // OPTIMIZATION: Dynamic batch size based on face count
        const batchSize = this.calculateOptimalBatchSize(facesByStatus.process.length, options);
        
        // Process in batches with intelligent concurrency
        const batchPromises: Promise<Media[]>[] = [];
        
        for (let i = 0; i < facesByStatus.process.length; i += batchSize) {
          const batch = facesByStatus.process.slice(i, i + batchSize);
          
          // Create a promise for this batch
          const batchPromise = (async () => {
            // Process all faces in batch
            const batchResults = await Promise.all(
              batch.map(face => this.processVerifiedFace(face, options))
            );
            
            // Filter out null results
            return batchResults.filter((result): result is Media => result !== null);
          })();
          
          batchPromises.push(batchPromise);
        }
        
        // Execute all batches and collect results
        const batchResults = await Promise.all(batchPromises);
        processedFaces = batchResults.flat();
      }
      
      // Ensure deletion completes
      await deletePromise;
      
      // OPTIMIZATION: Schedule embedding generation in batches
      if (processedFaces.length > 0) {
        const embeddingQueue = processedFaces.map(media => ({
          mediaId: String(media.mediaId),
          memberId: String(media.ownerId)
        }));
        
        // Group embeddings by member for better efficiency
        const embeddingsByMember = embeddingQueue.reduce((acc, item) => {
          if (!acc[item.memberId]) {
            acc[item.memberId] = [];
          }
          acc[item.memberId].push(item);
          return acc;
        }, {} as Record<string, typeof embeddingQueue>);
        
        // Process embeddings for each member in sequence but members in parallel
        Object.values(embeddingsByMember).forEach(memberEmbeddings => {
          this.queueManagerService.addToBackgroundQueue(async () => {
            await this.processEmbeddingQueue(memberEmbeddings, options);
          }, 15);
        });
      }
  
      logger.info(`✅ Successfully processed ${processedFaces.length} verified faces`);
      return processedFaces;
    } catch (error) {
      logger.error(`❌ Error processing verified faces: ${error.message}`);
      throw new BadRequestException(`Failed to process verified faces: ${error.message}`);
    }
  }
  
  /**
   * Process a single verified face
   * 
   * @private
   * @param face The verified face information
   * @param options Optional processing options
   */
  private async processVerifiedFace(
    face: { faceId: string; memberId: string; status: 'avatar' | 'label' | 'unknown' },
    options?: MediaOptions
  ): Promise<Media | null> {
    try {
      // Get the face media
      const faceMedia = await this.mediaRepository.findById(face.faceId);
      
      if (!faceMedia) {
        logger.warn(`Media for face ID ${face.faceId} not found, skipping`);
        return null;
      }
      
      // OPTIMIZATION: Check if update is needed
      if (faceMedia.status === face.status && faceMedia.ownerId?.toString() === face.memberId) {
        logger.info(`Face ID ${face.faceId} already has correct status and owner, skipping update`);
        return faceMedia;
      }
      
      // Update the media status
      const updatedMedia = await this.mediaRepository.update(face.faceId, {
        status: face.status,
        ownerId: face.memberId // Ensure correct owner ID
      });
      
      return updatedMedia;
    } catch (error) {
      logger.error(`Error processing verified face ${face.faceId}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Compare two faces and return a similarity score
   * 
   * @param file1 First face file
   * @param file2 Second face file
   * @param options Optional comparison options
   * @returns Similarity score (0-1)
   */
  async compareFaces(
    file1: MulterFile,
    file2: MulterFile,
    options?: MediaOptions
  ): Promise<number> {
    try {
      // OPTIMIZATION: Preprocess images for more accurate detection
      const [optimizedFile1, optimizedFile2] = await Promise.all([
        this.quickOptimizeImage(file1, options),
        this.quickOptimizeImage(file2, options)
      ]);
      
      // Extract face embeddings in parallel
      const [embedding1Promise, embedding2Promise] = [
        this.faceEmbeddingService.extractFaceEmbedding(optimizedFile1),
        this.faceEmbeddingService.extractFaceEmbedding(optimizedFile2)
      ];
      
      const [embedding1, embedding2] = await Promise.all([embedding1Promise, embedding2Promise]);
      
      if (!embedding1.success || !embedding2.success || 
          !embedding1.faceDescriptor || !embedding2.faceDescriptor) {
        logger.warn('Failed to extract embeddings from one or both images');
        return 0;
      }
      
      // Calculate similarity using the enhanced algorithm
      const similarity = this.faceEmbeddingService.calculateHybridSimilarity(
        embedding1.faceDescriptor,
        embedding2.faceDescriptor
      );
      
      logger.info(`Face comparison similarity: ${similarity.toFixed(4)}`);
      return similarity;
    } catch (error) {
      logger.error(`Error comparing faces: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Find similar faces to the provided face
   * 
   * @param file The face file to search for
   * @param options Optional search options
   * @returns Array of similar faces with similarity scores
   */
  async findSimilarFaces(
    file: MulterFile,
    options?: MediaOptions
  ): Promise<any[]> {
    try {
      // OPTIMIZATION: Quick preprocess for better recognition
      const optimizedFile = await this.quickOptimizeImage(file, options);
      
      // Use the facial search service to find similar faces
      const searchResults = await this.facialSearchService.searchFacesByImage(optimizedFile, {
        similarityThreshold: options?.embedding?.similarityThreshold || 0.65,
        maxResults: options?.search?.maxResults || 10,
        includeDetails: options?.search?.includeDetails !== false
      });
      
      logger.info(`Found ${searchResults.length} similar faces`);
      return searchResults;
    } catch (error) {
      logger.error(`Error finding similar faces: ${error.message}`);
      return [];
    }
  }
}