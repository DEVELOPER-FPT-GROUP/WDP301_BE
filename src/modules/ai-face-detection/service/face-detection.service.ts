import { BadRequestException, Injectable } from '@nestjs/common';
import { IFaceDetectionService, FaceDetectionResult } from './face-detection.service.interface';
import { MulterFile } from 'src/common/types/multer-file.type';
import { winstonLogger as logger } from 'src/common/winston-logger';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FaceDetectionService implements IFaceDetectionService {
  private readonly TEMP_DIR = path.join(os.tmpdir(), 'face-detection');
  private modelsLoaded = false;
  private faceapi: any;

  constructor() {
    this.initService().catch((error) => {
      logger.error(`❌ Initialization failed: ${error.message}`);
    });
  }

  private async initService() {
    try {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
      this.faceapi = await this.loadModels();
      this.modelsLoaded = true;
      logger.info('✅ Face detection models loaded successfully');
    } catch (error) {
      logger.error(`❌ Failed to initialize face detection service: ${error.message}`);
    }
  }

  private async loadModels() {
    try {
      const faceapi = await import('face-api.js');
      const canvas = await import('canvas');
      const { Canvas, Image } = canvas;

      faceapi.env.monkeyPatch({ Canvas: Canvas as any, Image: Image as any });

      const modelsPath = path.join(process.cwd(), 'models');
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
      ]);

      return faceapi;
    } catch (error) {
      logger.error(`❌ Failed to load face detection models: ${error.message}`);
      throw new Error(`Failed to load face detection models: ${error.message}`);
    }
  }

  async detectAndCropFaces(file: MulterFile): Promise<{ faceBuffer: Buffer; faceId: string; status: 'unknown' }[]> {
    try {
      logger.info(`🔍 Processing face detection for file: ${file.originalname}`);
  
      const faceapi = this.faceapi || (await this.loadModels());
      const sharp = (await import('sharp')).default || require('sharp');
      const canvas = await import('canvas');
  
      // Convert WebP if necessary and load image
      const imageBuffer = await this.convertWebPIfNeeded(file.buffer);
      const img = await canvas.loadImage(imageBuffer);
      const c = canvas.createCanvas(img.width, img.height);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);
  
      // Detect faces
      const detections = await faceapi.detectAllFaces(c).withFaceLandmarks().withFaceDescriptors();
  
      if (detections.length === 0) {
        logger.warn(`❌ No faces detected in image: ${file.originalname}`);
        return [];
      }
  
      logger.info(`✅ Detected ${detections.length} faces in image: ${file.originalname}`);
  
      const metadata = await sharp(imageBuffer).metadata();
      const imgWidth = metadata.width ?? 0;
      const imgHeight = metadata.height ?? 0;
  
      // Define padding (Restoring to 0.6 for better cropping)
      const PADDING_FACTOR = 0.6;
      const avatarSize = 600;
  
      // Define circular mask
      const circleMask = Buffer.from(
        `<svg width="${avatarSize}" height="${avatarSize}">
          <circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" fill="white"/>
        </svg>`
      );
  
      // Process each detected face
      return await Promise.all(
        detections.map(async (detection, index) => {
          const faceId = `${file.originalname}-face-${index}-${Date.now()}`;
          const box = detection.detection.box;
  
          // Calculate padding
          const paddingX = Math.floor(box.width * PADDING_FACTOR);
          const paddingY = Math.floor(box.height * PADDING_FACTOR);
  
          // Ensure cropping does not exceed image boundaries
          const newX = Math.max(0, box.x - paddingX);
          const newY = Math.max(0, box.y - paddingY);
          const newWidth = Math.min(imgWidth - newX, box.width + paddingX * 2);
          const newHeight = Math.min(imgHeight - newY, box.height + paddingY * 2);
  
          const faceBuffer = await sharp(imageBuffer)
            .extract({ left: Math.floor(newX), top: Math.floor(newY), width: Math.floor(newWidth), height: Math.floor(newHeight) })
            .resize(avatarSize, avatarSize, { fit: 'cover' })
            .sharpen()
            .linear(1.2, -20) // Adjust contrast
            .modulate({ brightness: 1.03 }) // Brightness enhancement
            .composite([{ input: circleMask, blend: 'dest-in' }]) // Apply circular mask
            .png({ compressionLevel: 9 })
            .toBuffer();
  
          logger.info(`✅ Processed face ${index + 1} of ${detections.length}`);
  
          return { faceBuffer, faceId, status: 'unknown' };
        })
      );
    } catch (error) {
      logger.error(`❌ Face detection error: ${error.message}`);
      return [];
    }
  }
  
  async convertWebPIfNeeded(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const sharp = (await import('sharp')).default || require('sharp');
  
      // Detect image format
      const metadata = await sharp(imageBuffer).metadata();
  
      // Convert WebP to PNG if needed
      if (metadata.format === 'webp') {
        logger.info(`🔄 Converting WebP to PNG for processing.`);
        return await sharp(imageBuffer).png().toBuffer();
      }
  
      // If not WebP, return original buffer
      return imageBuffer;
    } catch (error) {
      logger.error(`❌ Error converting WebP image: ${error.message}`);
      throw new BadRequestException(`Failed to process image: ${error.message}`);
    }
  }
  
  
}
