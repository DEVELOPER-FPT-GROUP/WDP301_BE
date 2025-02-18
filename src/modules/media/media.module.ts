import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './schema/media.schema';
import { MediaRepository } from './repository/media.repository';
import { MediaService } from './serivce/media.service';
import { MediaController } from './controller/media.controller';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]), // ✅ Register Mongoose schema
  ],
  controllers: [MediaController], // ✅ Connect Controller
  providers: [MediaService, MediaRepository], // ✅ Register Service & Repository
  exports: [MediaService, MediaRepository], // ✅ Allow reusability in other modules
})
export class MediaModule {}
