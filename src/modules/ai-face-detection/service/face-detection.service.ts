import { BadRequestException, Injectable } from '@nestjs/common';
import { IFaceDetectionService, FaceDetectionResult } from './face-detection.service.interface';
import { MulterFile } from 'src/common/types/multer-file.type';
import { winstonLogger as logger } from 'src/common/winston-logger';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

@Injectable()
export class FaceDetectionService implements IFaceDetectionService {
  private readonly TEMP_DIR = path.join(os.tmpdir(), 'face-detection');
  private modelsLoaded = false;
  private faceapi: any;

  constructor() {
    this.initService();
  }

  private async initService() {
    try {
      await mkdir(this.TEMP_DIR, { recursive: true });
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
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);

      return faceapi;
    } catch (error) {
      logger.error(`❌ Failed to load face detection models: ${error.message}`);
      throw new Error(`Failed to load face detection models: ${error.message}`);
    }
  }

  private async getFaceApi() {
    if (!this.modelsLoaded) {
      this.faceapi = await this.loadModels();
      this.modelsLoaded = true;
    }
    return this.faceapi;
  }

  private async saveBufferToTempFile(buffer: Buffer, extension = 'png'): Promise<string> {
    const filename = `${uuidv4()}.${extension}`;
    const filePath = path.join(this.TEMP_DIR, filename);
    await writeFile(filePath, buffer);
    return filePath;
  }

  private async convertWebPIfNeeded(filePath: string): Promise<string> {
    try {
      const sharp = (await import('sharp')).default || require('sharp');

      const metadata = await sharp(filePath).metadata();

      if (metadata.format === 'webp') {
        const newPath = filePath.replace(/\.(webp)$/, '.png');
        await sharp(filePath).toFormat('png').toFile(newPath);
        await unlink(filePath);
        return newPath;
      }

      return filePath;
    } catch (error) {
      logger.error(`❌ Failed to convert image format: ${error.message}`);
      throw new Error(`Failed to convert image format: ${error.message}`);
    }
  }

  async detectAndCropFaces(file: MulterFile): Promise<FaceDetectionResult[]> {
    try {
      logger.info(`🔍 Starting face detection for file: ${file.originalname}`);
  
      // Save image buffer as a temporary file
      const tempFilePath = await this.saveBufferToTempFile(file.buffer);
      const processedFilePath = await this.convertWebPIfNeeded(tempFilePath);
  
      const faceapi = await this.getFaceApi();
      const canvas = await import('canvas');
      const sharp = (await import('sharp')).default || require('sharp');
  
      // Load image into a canvas
      const image = await canvas.loadImage(processedFilePath);
      const c = canvas.createCanvas(image.width, image.height);
      const ctx = c.getContext('2d');
      ctx.drawImage(image, 0, 0, image.width, image.height);
  
      // Perform face detection
      const detections = await faceapi.detectAllFaces(c)
          .withFaceLandmarks()
          .withFaceDescriptors();
  
      if (detections.length === 0) {
        logger.warn(`❌ No faces detected in image: ${file.originalname}`);
        await unlink(processedFilePath);
        return [];
      }
  
      logger.info(`✅ Detected ${detections.length} faces in image: ${file.originalname}`);
  
      const metadata = await sharp(processedFilePath).metadata();
      const imgWidth = metadata.width ?? 0;
      const imgHeight = metadata.height ?? 0;
  
      // Create circular mask
      const avatarSize = 600;
      const circleMask = Buffer.from(
        `<svg width="${avatarSize}" height="${avatarSize}">
          <circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" fill="white"/>
        </svg>`
      );
  
      // Process each detected face
      const faceBuffers = await Promise.all(detections.map(async (detection, index) => {
        const box = detection.detection.box;
        const PADDING_FACTOR = 0.6; // Adjust for better framing
        const paddingX = Math.floor(box.width * PADDING_FACTOR);
        const paddingY = Math.floor(box.height * PADDING_FACTOR);
        const newX = Math.max(0, box.x - paddingX);
        const newY = Math.max(0, box.y - paddingY);
        const newWidth = Math.min(imgWidth - newX, box.width + paddingX * 2);
        const newHeight = Math.min(imgHeight - newY, box.height + paddingY * 2);
  
        const faceBuffer = await sharp(processedFilePath)
          .extract({ left: Math.floor(newX), top: Math.floor(newY), width: Math.floor(newWidth), height: Math.floor(newHeight) })
          .resize(avatarSize, avatarSize, { fit: 'cover' })
          .sharpen()
          .linear(1.2, -20) // Adjust contrast
          .modulate({ brightness: 1.03 }) // Brightness enhancement
          .composite([{ input: circleMask, blend: 'dest-in' }]) // Apply circular mask
          .png({ compressionLevel: 9 }) // Optimize PNG
          .toBuffer();
  
        logger.info(`✅ Processed face ${index + 1} of ${detections.length}`);
  
        return { success: true, faceBuffer };
      }));
  
      // Cleanup temp file
      await unlink(processedFilePath);
  
      logger.info(`✅ Completed processing ${faceBuffers.length} faces from ${file.originalname}`);
      
      return faceBuffers;
    } catch (error) {
      logger.error(`❌ Face detection error: ${error.message}`);
      return [];
    }
  }
  
  
}
