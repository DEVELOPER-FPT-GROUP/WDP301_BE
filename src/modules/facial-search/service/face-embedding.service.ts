import { BadRequestException, Injectable } from '@nestjs/common';
import { MulterFile } from 'src/common/types/multer-file.type';
import { winstonLogger as logger } from 'src/common/winston-logger';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { setupTFBackendAndLoadFaceAPI } from 'src/utils/tf-loader';

export interface FaceEmbeddingResult {
  success: boolean;
  faceDescriptor?: Float32Array;
  error?: string;
}

// Define regions of face embedding vectors with their weights
interface RegionWeight {
  startIdx: number;
  endIdx: number;
  weight: number;
}

@Injectable()
export class FaceEmbeddingService {
  private readonly TEMP_DIR = path.join(os.tmpdir(), 'face-embedding');
  private modelsLoaded = false;
  private faceapi: any;
  
  // Base regions for face descriptor components (total 128 elements)
  // Prioritize important facial regions like eyes, nose, mouth areas
  private readonly FACE_REGION_WEIGHTS: RegionWeight[] = [
    { startIdx: 0, endIdx: 15, weight: 1.5 },    // Eyes region (higher weight)
    { startIdx: 16, endIdx: 31, weight: 1.8 },   // Nose bridge (highest weight)
    { startIdx: 32, endIdx: 47, weight: 1.7 },   // Mouth region (higher weight)
    { startIdx: 48, endIdx: 63, weight: 1.2 },   // Cheeks (medium weight)
    { startIdx: 64, endIdx: 95, weight: 1.0 },   // Jawline (normal weight)
    { startIdx: 96, endIdx: 127, weight: 0.7 },  // Forehead (lower weight)
  ];

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
      return await setupTFBackendAndLoadFaceAPI();
    } catch (error) {
      logger.error(`❌ Failed to load face embedding models: ${error.message}`);
      throw new Error(`Failed to load face embedding models: ${error.message}`);
    }
  }
  /**
   * Original cosine similarity calculation (preserved for backward compatibility)
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
   * Calculate weighted cosine similarity between two face descriptors
   * Applies different weights to different regions of the face descriptor
   */
  calculateWeightedSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
      return 0;
    }

    let weightedDotProduct = 0;
    let weightedNorm1 = 0;
    let weightedNorm2 = 0;
    let totalWeight = 0;

    // Process each region with its specific weight
    for (const region of this.FACE_REGION_WEIGHTS) {
      let regionDotProduct = 0;
      let regionNorm1 = 0;
      let regionNorm2 = 0;
      
      for (let i = region.startIdx; i <= region.endIdx; i++) {
        regionDotProduct += descriptor1[i] * descriptor2[i];
        regionNorm1 += descriptor1[i] * descriptor1[i];
        regionNorm2 += descriptor2[i] * descriptor2[i];
      }
      
      // Apply region weight
      weightedDotProduct += regionDotProduct * region.weight;
      weightedNorm1 += regionNorm1 * region.weight;
      weightedNorm2 += regionNorm2 * region.weight;
      totalWeight += region.weight;
    }

    // Avoid division by zero
    if (weightedNorm1 === 0 || weightedNorm2 === 0) return 0;
    
    // Normalize by total weight
    return weightedDotProduct / (Math.sqrt(weightedNorm1) * Math.sqrt(weightedNorm2));
  }

  /**
   * Improved weighted cosine similarity with dynamic region importance
   */
  calculateEnhancedSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
      return 0;
    }

    // Dynamic region weights based on variance analysis
    const regionWeights = this.calculateDynamicWeights(descriptor1, descriptor2);
    
    let weightedDotProduct = 0;
    let weightedNorm1 = 0;
    let weightedNorm2 = 0;
    let totalWeight = 0;

    // Process each region with its dynamic weight
    for (const region of regionWeights) {
      let regionDotProduct = 0;
      let regionNorm1 = 0;
      let regionNorm2 = 0;
      
      for (let i = region.startIdx; i <= region.endIdx; i++) {
        regionDotProduct += descriptor1[i] * descriptor2[i];
        regionNorm1 += descriptor1[i] * descriptor1[i];
        regionNorm2 += descriptor2[i] * descriptor2[i];
      }
      
      // Apply region weight
      weightedDotProduct += regionDotProduct * region.weight;
      weightedNorm1 += regionNorm1 * region.weight;
      weightedNorm2 += regionNorm2 * region.weight;
      totalWeight += region.weight;
    }

    // Avoid division by zero
    if (weightedNorm1 === 0 || weightedNorm2 === 0) return 0;
    
    // Normalize by total weight
    return weightedDotProduct / (Math.sqrt(weightedNorm1) * Math.sqrt(weightedNorm2));
  }

  /**
   * Calculate dynamic weights based on descriptor variance
   */
  private calculateDynamicWeights(descriptor1: Float32Array, descriptor2: Float32Array): RegionWeight[] {
    const dynamicWeights: RegionWeight[] = JSON.parse(JSON.stringify(this.FACE_REGION_WEIGHTS));
    
    // Calculate variance for each region
    for (const region of dynamicWeights) {
      let variance = 0;
      
      for (let i = region.startIdx; i <= region.endIdx; i++) {
        const diff = Math.abs(descriptor1[i] - descriptor2[i]);
        variance += diff * diff;
      }
      
      // Normalize variance by region size
      variance /= (region.endIdx - region.startIdx + 1);
      
      // Adjust weight based on variance (less variance = more important region)
      // Use inverse relationship with a minimum floor
      const varianceWeight = 1 / (1 + variance * 10);
      
      // Combine base weight with variance-based weight
      region.weight = region.weight * 0.7 + varianceWeight * 0.3;
    }
    
    return dynamicWeights;
  }

  /**
   * Calculate weighted Euclidean distance between face descriptors
   * Lower values indicate better matches
   */
  calculateWeightedDistance(descriptor1: Float32Array, descriptor2: Float32Array): number {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
      return Infinity;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    // Process each region with its specific weight
    for (const region of this.FACE_REGION_WEIGHTS) {
      let regionSum = 0;
      
      for (let i = region.startIdx; i <= region.endIdx; i++) {
        const diff = descriptor1[i] - descriptor2[i];
        regionSum += diff * diff;
      }
      
      // Apply region weight
      weightedSum += regionSum * region.weight;
      totalWeight += region.weight;
    }

    // Normalize by total weight
    return Math.sqrt(weightedSum / totalWeight);
  }

  /**
   * Manhattan distance for key facial feature points
   */
  private calculateManhattanDistance(descriptor1: Float32Array, descriptor2: Float32Array): number {
    // Focus on critical regions (eyes, nose, mouth - indices determined by face-api.js)
    const keyPoints = [
      // Eyes region
      { start: 0, end: 15 },
      // Nose region
      { start: 16, end: 31 },
      // Mouth region
      { start: 32, end: 47 }
    ];
    
    let totalDistance = 0;
    let pointCount = 0;
    
    for (const region of keyPoints) {
      for (let i = region.start; i <= region.end; i++) {
        totalDistance += Math.abs(descriptor1[i] - descriptor2[i]);
        pointCount++;
      }
    }
    
    return totalDistance / pointCount;
  }

  /**
   * Hybrid similarity score that combines multiple metrics
   */
  calculateHybridSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
      return 0;
    }
    
    // Calculate different similarity metrics
    const weightedSimilarity = this.calculateEnhancedSimilarity(descriptor1, descriptor2);
    const weightedDistance = this.calculateWeightedDistance(descriptor1, descriptor2);
    
    // Normalize distance to similarity score (0-1 range)
    const distanceThreshold = 0.8;
    const normalizedDistance = Math.max(0, 1 - (weightedDistance / distanceThreshold));
    
    // Calculate Manhattan distance for key facial points
    const manhattanDistance = this.calculateManhattanDistance(descriptor1, descriptor2);
    const normalizedManhattan = Math.max(0, 1 - (manhattanDistance / 4));
    
    // Weighted combination of metrics
    const hybridScore = (
      weightedSimilarity * 0.6 + 
      normalizedDistance * 0.25 + 
      normalizedManhattan * 0.15
    );
    
    return hybridScore;
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

      // Pre-process image for better face detection
      const image = await sharp(file.buffer)
        .toFormat('png')
        // Adjust contrast and brightness for better face detection
        .modulate({ brightness: 1.05, saturation: 1.1 })
        .toBuffer();
        
      const img = await canvas.loadImage(image);
      const c = canvas.createCanvas(img.width, img.height);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Detect faces and get descriptors with better detection options
      const detectionOptions = new faceapi.SsdMobilenetv1Options({ 
        minConfidence: 0.5,
        maxResults: 5 
      });
      
      const detections = await faceapi.detectAllFaces(c, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections.length) {
        logger.warn(`❌ No faces detected in image: ${file.originalname}`);
        return { success: false, error: 'No faces detected in the image' };
      }

      if (detections.length > 1) {
        logger.warn(`⚠️ Multiple faces (${detections.length}) detected in image: ${file.originalname}`);
        
        // For multiple faces, choose the one with highest detection confidence or largest size
        detections.sort((a, b) => {
          const sizeA = a.detection.box.width * a.detection.box.height;
          const sizeB = b.detection.box.width * b.detection.box.height;
          
          // Prioritize faces that are larger or more confident
          return (b.detection.score * 0.7 + sizeB * 0.3) - 
                 (a.detection.score * 0.7 + sizeA * 0.3);
        });
        
        logger.info(`Using the most prominent face with confidence: ${detections[0].detection.score.toFixed(3)}`);
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
   * Compare two faces and return similarity score using hybrid algorithm
   */
  async compareFaces(file1: MulterFile, file2: MulterFile): Promise<number> {
    const result1 = await this.extractFaceEmbedding(file1);
    const result2 = await this.extractFaceEmbedding(file2);

    if (!result1.success || !result2.success) {
      logger.warn('Face comparison failed: Could not extract embeddings from both images');
      return 0;
    }

    // Use hybrid similarity for more accurate comparison
    const hybridScore = this.calculateHybridSimilarity(
      result1.faceDescriptor as Float32Array, 
      result2.faceDescriptor as Float32Array
    );

    logger.info(`📊 Face comparison using hybrid algorithm: score=${hybridScore.toFixed(4)}`);
    
    return hybridScore;
  }
  
  /**
   * Check if two face embeddings are from the same person
   * Returns true if the similarity score exceeds the threshold
   */
  isSamePerson(descriptor1: Float32Array, descriptor2: Float32Array, threshold = 0.65): boolean {
    const similarityScore = this.calculateHybridSimilarity(descriptor1, descriptor2);
    return similarityScore >= threshold;
  }
}