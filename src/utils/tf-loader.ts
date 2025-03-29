// shared/utils/tf-loader.ts
import * as faceapi from '@vladmandic/face-api';
import * as path from 'path';
import { winstonLogger as logger } from 'src/common/winston-logger';
export async function setupTFBackendAndLoadFaceAPI() {
    await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-node-gpu');
    const tf = await import('@tensorflow/tfjs');
    const faceapi = await import('@vladmandic/face-api');
    const canvas = await import('canvas');
    faceapi.env.monkeyPatch({ Canvas: canvas.Canvas as any, Image: canvas.Image as any });
  
    const modelsPath = path.join(process.cwd(), 'models');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
    ]);
  
    logger.info(`✅ TFJS Backend: ${tf.getBackend()}`);
    return faceapi;
  }
  