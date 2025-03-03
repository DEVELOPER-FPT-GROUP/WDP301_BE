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

  async detectAndCropFace(file: MulterFile): Promise<FaceDetectionResult> {
    try {
      logger.info(`🔍 Starting face detection for file: ${file.originalname}`);
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
        return { success: false, message: 'No faces detected in the image' };
      }

      logger.info(`✅ Detected ${detections.length} faces in image: ${file.originalname}`);

      let primaryFace = detections.length > 1
          ? detections.sort((a, b) => (b.detection.box.width * b.detection.box.height) - (a.detection.box.width * a.detection.box.height))[0]
          : detections[0];

      const box = primaryFace.detection.box;
      const paddingX = Math.floor(box.width * 0.5);
      const paddingY = Math.floor(box.height * 0.7);

      const metadata = await sharp(processedFilePath).metadata();
      const imgWidth = metadata.width ?? 0;
      const imgHeight = metadata.height ?? 0;

      const newX = Math.max(0, box.x - paddingX);
      const newY = Math.max(0, box.y - paddingY);
      const newWidth = Math.min(imgWidth - newX, box.width + paddingX * 2);
      const newHeight = Math.min(imgHeight - newY, box.height + paddingY * 2);

      const faceBuffer = await sharp(processedFilePath)
          .extract({ left: Math.floor(newX), top: Math.floor(newY), width: Math.floor(newWidth), height: Math.floor(newHeight) })
          .toBuffer();

      const avatarSize = 600;
      const circleMask = Buffer.from(
          `<svg width="${avatarSize}" height="${avatarSize}">
          <circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" fill="white"/>
        </svg>`
      );

      const avatarBuffer = await sharp(faceBuffer)
          .resize(avatarSize, avatarSize, { fit: 'cover', position: 'center' })
          .composite([{ input: circleMask, blend: 'dest-in' }])
          .png()
          .toBuffer();

      await unlink(processedFilePath);
      logger.info(`✅ Face detection and cropping completed for: ${file.originalname}`);

      return { success: true, faceBuffer: avatarBuffer };
    } catch (error) {
      logger.error(`❌ Face detection error: ${error.message}`);
      return { success: false, message: `Face detection failed: ${error.message}` };
    }
  }
}
