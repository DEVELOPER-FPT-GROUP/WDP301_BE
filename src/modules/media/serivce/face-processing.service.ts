import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { MulterFile } from 'src/common/types/multer-file.type';
import { WorkerPoolService } from './worker-pool.service';
import { QueueManagerService } from './queue-manager.service';
import { MediaUploadService } from './media-upload.service';
import { MediaRepository } from '../repository/media.repository';
import { FaceDetectionService } from 'src/modules/ai-face-detection/service/face-detection.service';
import { FaceEmbeddingService } from 'src/modules/facial-search/service/face-embedding.service';
import { FacialSearchService } from 'src/modules/facial-search/service/facial-search.service';
import { FaceImageDto } from '../dto/response/face-respone.dto';
import { Media } from '../schema/media.schema';
import { winstonLogger as logger } from 'src/common/winston-logger';
import * as path from 'path';

@Injectable()
export class FaceProcessingService {
  private faceDetectionWorkerPath: string;
  private embeddingWorkerPath: string;
  private embeddingProcessingCache = new Set<string>();
  private readonly defaultDetectionOptions = {
    minConfidence: 0.5,
    maxFaces: 10,
    avatarSize: 600,
    paddingFactor: 0.6,
    enhanceImage: true,
    timeout: 45000
  };

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
    this.faceDetectionWorkerPath = path.resolve(process.cwd(), 'dist/modules/media/workers/face-detection.worker.js');
    this.embeddingWorkerPath = path.resolve(process.cwd(), 'dist/modules/media/workers/embedding.worker.js');
    this.configureQueueManager();
    
  }

  private configureQueueManager(): void {
    const cpuCount = require('os').cpus().length;
    const maxConcurrent = Math.max(3, Math.min(cpuCount - 1, 6));
    try {
      this.queueManagerService.setMaxConcurrentTasks(maxConcurrent);
      logger.info(`Set queue manager concurrency to ${maxConcurrent} tasks`);
    } catch (error) {
      logger.warn(`Failed to set max concurrent tasks: ${error.message}`);
    }
  }

  async detectAndUploadFaces(
    file: MulterFile,
    ownerId: string
  ): Promise<FaceImageDto[]> {
    try {
      const optimizedFile = await this.quickOptimizeImage(file);
      let detectedFaces: any[];
  
      try {
        detectedFaces = await this.processFacesWithWorker(optimizedFile, ownerId);
      } catch (err) {
        logger.warn(`❌ Worker failed: ${err.message}, fallback to direct.`);
        detectedFaces = await this.faceDetectionService.detectAndCropFaces(optimizedFile);
      }
  
      if (!detectedFaces || detectedFaces.length === 0) {
        logger.warn(`No faces detected for owner ${ownerId}`);
        return [];
      }
  
      const savedMediaList = await this.processMultipleFacesInParallel(
        detectedFaces,
        optimizedFile,
        ownerId
      );
  
      const faceImageDtos: FaceImageDto[] = savedMediaList.map((media) => {
        return {
          faceId: String(media.mediaId),
          previewUrl: media.url,
          status: 'unknown',
        };
      });
  
      // Không block API - chạy background
      this.embedFacesInBackground(faceImageDtos);
  
      return faceImageDtos;
    } catch (err) {
      logger.error(`detectAndUploadFaces error: ${err.message}`);
      throw new BadRequestException(`Face detection failed: ${err.message}`);
    }
  }
  
  async embedFacesInBackground(faceImages: FaceImageDto[]): Promise<void> {
    if (!faceImages || faceImages.length === 0) return;
  
    const embeddingQueue: { mediaId: string; memberId: string }[] = [];
  
    for (const face of faceImages) {
      const media = await this.mediaRepository.findById(face.faceId);
      if (media?.ownerId) {
        embeddingQueue.push({
          mediaId: face.faceId,
          memberId: String(media.ownerId),
        });
      }
    }
  
    if (embeddingQueue.length === 0) {
      logger.warn('No valid mediaId/memberId pairs for embedding');
      return;
    }
  
    this.queueManagerService.addToBackgroundQueue(async () => {
      await this.processEmbeddingQueue(embeddingQueue);
    }, 15); // Medium priority
  }
  

  private async quickOptimizeImage(file: MulterFile): Promise<MulterFile> {
    try {
      if (file.size < 100 * 1024) return file;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return file;

      const sharpModule = await import('sharp');
      const sharp = sharpModule.default || sharpModule;
      
      const processed = await sharp(file.buffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      return { ...file, buffer: processed, size: processed.length };
    } catch (error) {
      logger.warn(`Image optimization failed: ${error.message}`);
      return file;
    }
  }

  private async processFacesWithWorker(file: MulterFile, ownerId: string): Promise<any[]> {
    const timeout = this.defaultDetectionOptions.timeout;

    const detectionOptions = {
      minConfidence: this.defaultDetectionOptions.minConfidence,
      maxFaces: this.defaultDetectionOptions.maxFaces,
      avatarSize: this.defaultDetectionOptions.avatarSize,
      paddingFactor: this.defaultDetectionOptions.paddingFactor,
      enhanceImage: this.defaultDetectionOptions.enhanceImage,
    };

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Detection timed out')), timeout);
      this.workerPoolService
        .runTaskWithWorker(this.faceDetectionWorkerPath, {
          fileBuffer: file.buffer,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          ownerId,
          options: detectionOptions
        }, 'face-detection', timeout)
        .then((res) => {
          clearTimeout(timeoutId);
          resolve(res as any[]);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
  }

  private async processMultipleFacesInParallel(
    detectedFaces: any[],
    file: MulterFile,
    ownerId: string
  ): Promise<Media[]> {
    const results: Media[] = [];
    const concurrency = 3;

    for (let i = 0; i < detectedFaces.length; i += concurrency) {
      const batch = detectedFaces.slice(i, i + concurrency);

      const promises = batch.map(async (face, index) => {
        try {
          const sharpModule = await import('sharp');
          const sharp = sharpModule.default || sharpModule;
          
          const faceBuffer = await sharp(face.faceBuffer).jpeg({ quality: 85 }).toBuffer();

          const upload = await this.mediaUploadService.uploadFile(
            {
              ...file,
              buffer: faceBuffer,
              mimetype: 'image/jpeg',
              originalname: `face_${ownerId}_${i + index}.jpg`,
              size: faceBuffer.length
            },
            ownerId,
            'Member'
          );

          const status = (i + index === 0) ? 'avatar' : 'label';
          return await this.mediaRepository.update(upload.mediaId, { status });
        } catch (err) {
          logger.warn(`process face failed: ${err.message}`);
          return null;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(Boolean) as Media[]);
    }

    return results;
  }

  private async processEmbeddingQueue(queue: { mediaId: string; memberId: string }[]): Promise<void> {
    const batchSize = 3;

    for (let i = 0; i < queue.length; i += batchSize) {
      const batch = queue.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ({ mediaId, memberId }) => {
          try {
            const key = `embedding:${mediaId}`;
            if (this.embeddingProcessingCache.has(key)) return;

            this.embeddingProcessingCache.add(key);
            const media = await this.mediaRepository.findById(mediaId);
            if (!media) return;

            const imageBuffer = await this.mediaUploadService.downloadMediaFromUrl(media.url);
            await this.facialSearchService.storeEmbeddingForMember(
              mediaId,
              memberId,
              await this.extractEmbedding(imageBuffer)
            );

            logger.info(`✅ Embedded ${mediaId}`);
            this.embeddingProcessingCache.delete(key);
          } catch (err) {
            logger.warn(`Embedding failed for ${mediaId}: ${err.message}`);
          }
        })
      );
    }
  }

  private async extractEmbedding(buffer: Buffer): Promise<number[]> {
    const file: MulterFile = {
      buffer,
      originalname: 'embedding.jpg',
      mimetype: 'image/jpeg',
      size: buffer.length,
      fieldname: 'file',
      encoding: '7bit',
    };

    const result = await this.faceEmbeddingService.extractFaceEmbedding(file);
    if (!result.success || !result.faceDescriptor) throw new Error('Embedding failed');
    return Array.from(result.faceDescriptor);
  }

  async verifyAndProcessFaces(
    verifiedFaces: { faceId: string; memberId: string; status: 'avatar' | 'label' | 'unknown' }[],
  ): Promise<Media[]> {
    if (!verifiedFaces || verifiedFaces.length === 0) {
      throw new BadRequestException('No verified faces provided.');
    }
  
    logger.http(`Processing ${verifiedFaces.length} verified faces`);
  
    const toDelete = verifiedFaces
  .filter((face): face is { faceId: string; memberId: string; status: 'unknown' } => face.status === 'unknown');
  const toProcess = verifiedFaces.filter(
    (face): face is { faceId: string; memberId: string; status: 'avatar' | 'label' } =>
      face.status === 'avatar' || face.status === 'label'
  );
  
  
    if (toDelete.length > 0) {
      await this.mediaUploadService.deleteUnknownFaces(toDelete);
    }
  
    let processedFaces: Media[] = [];
  
    
    if (toProcess.length > 0) {
      const concurrency = 3;
      for (let i = 0; i < toProcess.length; i += concurrency) {
        const batch = toProcess.slice(i, i + concurrency);
        const results = await Promise.all(batch.map(face => this.processVerifiedFace(face)));
        processedFaces.push(...(results.filter(Boolean) as Media[]));
      }
    }
    
  
    if (processedFaces.length > 0) {
      const queue = processedFaces.map(media => ({
        mediaId: String(media.mediaId),
        memberId: String(media.ownerId)
      }));
  
      this.queueManagerService.addToBackgroundQueue(async () => {
        await this.processEmbeddingQueue(queue);
      }, 10);
    }
  
    logger.info(`✅ Verified and processed ${processedFaces.length} faces`);
    return processedFaces;
  }
  
  // ✅ Phụ trợ cho verifyAndProcessFaces
  private async processVerifiedFace(
    face: { faceId: string; memberId: string; status: 'avatar' | 'label' }
  ): Promise<Media | null> {
    try {
      const media = await this.mediaRepository.findById(face.faceId);
      if (!media) {
        logger.warn(`Face ID ${face.faceId} not found`);
        return null;
      }
  
      if (media.status === face.status && media.ownerId?.toString() === face.memberId) {
        logger.debug(`No changes needed for face ID ${face.faceId}`);
        return media;
      }
  
      return await this.mediaRepository.update(face.faceId, {
        status: face.status,
        ownerId: face.memberId
      });
    } catch (error) {
      logger.error(`Error updating verified face: ${error.message}`);
      return null;
    }
  }

  enqueueEmbedding(queue: { mediaId: string; memberId: string }[]): void {
    this.queueManagerService.addToBackgroundQueue(async () => {
      await this.processEmbeddingQueue(queue);
    }, 10);
  }
  async getMediaById(mediaId: string): Promise<Media | null> {
    return this.mediaRepository.findById(mediaId);
  }
    
}
