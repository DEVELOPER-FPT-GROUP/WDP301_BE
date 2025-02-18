import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './schema/media.schema';
import { MediaRepository } from './repository/media.repository';
import { MediaService } from './serivce/media.service';
import { MediaController } from './controller/media.controller';
import { FirebaseModule } from '../firebase/firebase.module'; // ✅ Import FirebaseModule to use FirebaseStorageService
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]), // ✅ Register Mongoose schema
    // FirebaseModule
  ],
  controllers: [MediaController], // ✅ Connect Controller
  providers: [MediaService, MediaRepository, CloudinaryProvider, CloudinaryService], // ✅ Register Service & Repository
  exports: [MediaService, MediaRepository], // ✅ Allow reusability in other modules
})
export class MediaModule {}
