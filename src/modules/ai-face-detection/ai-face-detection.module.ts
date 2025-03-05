import { Module } from '@nestjs/common';
import { FaceDetectionService } from './service/face-detection.service';

@Module({
  providers: [FaceDetectionService],
  exports: [FaceDetectionService]
})
export class AiFaceDetectionModule {}