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

  async detectAndCropFaces(file: MulterFile): Promise<FaceDetectionResult[]> {
    try {
      logger.info(`🔍 Processing face detection for file: ${file.originalname}`);

      const faceapi = this.faceapi || (await this.loadModels());
      const sharp = (await import('sharp')).default || require('sharp');

      const canvas = await import('canvas');

      // Load image into memory (no need for temporary file)
      const image = await sharp(file.buffer).toFormat('png').toBuffer();
      const img = await canvas.loadImage(image);
      const c = canvas.createCanvas(img.width, img.height);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Perform face detection
      const detections = await faceapi.detectAllFaces(c).withFaceLandmarks().withFaceDescriptors();

      if (detections.length === 0) {
        logger.warn(`❌ No faces detected in image: ${file.originalname}`);
        return [];
      }

      logger.info(`✅ Detected ${detections.length} faces in image: ${file.originalname}`);

      const metadata = await sharp(file.buffer).metadata();
      const imgWidth = metadata.width ?? 0;
      const imgHeight = metadata.height ?? 0;

      // Define a circular mask for cropping
      const avatarSize = 600;
      const circleMask = Buffer.from(
        `<svg width="${avatarSize}" height="${avatarSize}">
          <circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" fill="white"/>
        </svg>`
      );

      // Process each detected face
      const faceBuffers = await Promise.all(
        detections.map(async (detection, index) => {
          const box = detection.detection.box;
          const PADDING_FACTOR = 0.6;
          const paddingX = Math.floor(box.width * PADDING_FACTOR);
          const paddingY = Math.floor(box.height * PADDING_FACTOR);
          const newX = Math.max(0, box.x - paddingX);
          const newY = Math.max(0, box.y - paddingY);
          const newWidth = Math.min(imgWidth - newX, box.width + paddingX * 2);
          const newHeight = Math.min(imgHeight - newY, box.height + paddingY * 2);

          const faceBuffer = await sharp(file.buffer)
            .extract({ left: Math.floor(newX), top: Math.floor(newY), width: Math.floor(newWidth), height: Math.floor(newHeight) })
            .resize(avatarSize, avatarSize, { fit: 'cover' })
            .sharpen()
            .linear(1.2, -20)
            .modulate({ brightness: 1.03 })
            .composite([{ input: circleMask, blend: 'dest-in' }])
            .png({ compressionLevel: 9 })
            .toBuffer();

          logger.info(`✅ Processed face ${index + 1} of ${detections.length}`);
          return { success: true, faceBuffer };
        })
      );

      logger.info(`✅ Successfully processed ${faceBuffers.length} faces from ${file.originalname}`);

      return faceBuffers;
    } catch (error) {
      logger.error(`❌ Face detection error: ${error.message}`);
      return [];
    }
  }

  
}
