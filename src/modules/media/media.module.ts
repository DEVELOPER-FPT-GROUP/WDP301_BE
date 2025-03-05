import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './schema/media.schema';
import { MediaRepository } from './repository/media.repository';
import { MediaService } from './serivce/media.service';
import { MediaController } from './controller/media.controller';
import { FirebaseModule } from '../firebase/firebase.module'; // ✅ Import FirebaseModule to use FirebaseStorageService
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MulterModule } from '@nestjs/platform-express';
import { FaceDetectionProvider } from '../ai-face-detection/providers/face-detection.provider';
import { FaceDetectionService } from '../ai-face-detection/service/face-detection.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]), // ✅ Register Mongoose schema
    // FirebaseModule
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // ✅ Set file size limit to 10MB
        files: 5, // ✅ Allow max 5 files per request
      },
    }),
  ],
  controllers: [MediaController], // ✅ Connect Controller
  providers: [MediaService, MediaRepository, CloudinaryProvider, CloudinaryService,FaceDetectionProvider, FaceDetectionService], // ✅ Register Service & Repository
  exports: [MediaService, MediaRepository], // ✅ Allow reusability in other modules
})
export class MediaModule {}
