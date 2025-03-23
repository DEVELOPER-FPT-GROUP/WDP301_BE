import { BadRequestException, Injectable } from '@nestjs/common';
import { MulterFile } from 'src/common/types/multer-file.type';
import { winstonLogger as logger } from 'src/common/winston-logger';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

export interface FaceEmbeddingResult {
  success: boolean;
  faceDescriptor?: Float32Array;
  error?: string;
}

@Injectable()
export class FaceEmbeddingService {
  private readonly TEMP_DIR = path.join(os.tmpdir(), 'face-embedding');
  private modelsLoaded = false;
  private faceapi: any;

  constructor() {
    this.initService().catch((error) => {
      logger.error(`❌ Face embedding initialization failed: ${error.message}`);
    });
  }

  private async initService() {
    try {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
      this.faceapi = await this.loadModels();
      this.modelsLoaded = true;
      logger.info('✅ Face embedding models loaded successfully');
    } catch (error) {
      logger.error(`❌ Failed to initialize face embedding service: ${error.message}`);
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
      logger.error(`❌ Failed to load face embedding models: ${error.message}`);
      throw new Error(`Failed to load face embedding models: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two face descriptors
   */
  calculateSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < descriptor1.length; i++) {
      dotProduct += descriptor1[i] * descriptor2[i];
      norm1 += descriptor1[i] * descriptor1[i];
      norm2 += descriptor2[i] * descriptor2[i];
    }

    // Avoid division by zero
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Extract face descriptor (embedding) from an image
   */
  async extractFaceEmbedding(file: MulterFile): Promise<FaceEmbeddingResult> {
    try {
      logger.info(`🔍 Extracting face embedding for file: ${file.originalname}`);

      const faceapi = this.faceapi || await this.loadModels();
      const canvas = await import('canvas');
      const sharp = (await import('sharp')).default || require('sharp');

      // Load image into memory
      const image = await sharp(file.buffer).toFormat('png').toBuffer();
      const img = await canvas.loadImage(image);
      const c = canvas.createCanvas(img.width, img.height);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Detect faces and get descriptors
      const detections = await faceapi.detectAllFaces(c)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections.length) {
        logger.warn(`❌ No faces detected in image: ${file.originalname}`);
        return { success: false, error: 'No faces detected in the image' };
      }

      if (detections.length > 1) {
        logger.warn(`⚠️ Multiple faces (${detections.length}) detected in image: ${file.originalname}. Using the first face.`);
      }

      // Use the first face's descriptor
      const faceDescriptor = detections[0].descriptor;
      logger.info(`✅ Successfully extracted face embedding from ${file.originalname}`);

      return { success: true, faceDescriptor };
    } catch (error) {
      logger.error(`❌ Face embedding extraction error: ${error.message}`);
      return { success: false, error: `Failed to extract face embedding: ${error.message}` };
    }
  }

  /**
   * Compare two faces and return similarity score
   */
  async compareFaces(file1: MulterFile, file2: MulterFile): Promise<number> {
    const result1 = await this.extractFaceEmbedding(file1);
    const result2 = await this.extractFaceEmbedding(file2);

    if (!result1.success || !result2.success) {
      logger.warn('Face comparison failed: Could not extract embeddings from both images');
      return 0;
    }

    const similarity = this.calculateSimilarity(
      result1.faceDescriptor as Float32Array, 
      result2.faceDescriptor as Float32Array
    );

    logger.info(`📊 Face similarity score: ${similarity.toFixed(4)}`);
    return similarity;
  }
}