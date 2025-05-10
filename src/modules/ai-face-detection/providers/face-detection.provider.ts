// src/modules/ai-face-detection/provider/face-detection.provider.ts
import { Provider } from '@nestjs/common';
import { FaceDetectionService } from '../service/face-detection.service';
import { winstonLogger as logger } from 'src/common/winston-logger';

/**
 * Provider token for the Face Detection Service
 */
export const FACE_DETECTION_SERVICE = 'FACE_DETECTION_SERVICE';

/**
 * Provider for Face Detection Service
 */
export const FaceDetectionProvider: Provider = {
  provide: FACE_DETECTION_SERVICE,
  useFactory: async () => {
    logger.info('🔧 Initializing Face Detection Service');
    const service = new FaceDetectionService();
    return service;
  }
};

/**
 * Array of all providers for the AI Face Detection module
 */
export const FaceDetectionProviders: Provider[] = [
  FaceDetectionProvider,
];