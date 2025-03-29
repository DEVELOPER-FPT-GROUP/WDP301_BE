import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './schema/media.schema';
import { MediaRepository } from './repository/media.repository';
import { MediaService } from './serivce/media.service';
import { MediaUploadService } from './serivce/media-upload.service';        // ✅ ADD
import { FaceProcessingService } from './serivce/face-processing.service'; // ✅ ADD
import { MediaController } from './controller/media.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MulterModule } from '@nestjs/platform-express';
import { FaceDetectionProvider } from '../ai-face-detection/providers/face-detection.provider';
import { FaceDetectionService } from '../ai-face-detection/service/face-detection.service';
import { FacialSearchModule } from '../facial-search/facial-search.module';
import { WorkerPoolService } from './serivce/worker-pool.service';         // ✅ ADD
import { QueueManagerService } from './serivce/queue-manager.service';     // ✅ ADD

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024,
        files: 5,
      },
    }),
    forwardRef(() => FacialSearchModule),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaRepository,
    CloudinaryProvider,
    CloudinaryService,
    FaceDetectionProvider,
    FaceDetectionService,
    MediaUploadService,         // ✅ REGISTER IT
    FaceProcessingService,      // ✅ REGISTER IT
    WorkerPoolService,          // ✅ REGISTER IT
    QueueManagerService         // ✅ REGISTER IT
  ],
  exports: [
    MediaService,
    MediaRepository,
  ],
})
export class MediaModule {}
