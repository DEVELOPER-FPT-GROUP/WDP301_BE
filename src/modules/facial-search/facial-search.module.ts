import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaceEmbedding, FaceEmbeddingSchema } from './schema/face-embedding.schema';
import { FaceEmbeddingRepository } from './repository/face-embedding.repository';
import { FaceEmbeddingService } from './service/face-embedding.service';
import { FacialSearchService } from './service/facial-search.service';
import { MediaModule } from '../media/media.module';
import { MembersModule } from '../members/members.module';
import { FacialSearchController } from './controller/facial-search.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FaceEmbedding.name, schema: FaceEmbeddingSchema },
    ]),
    forwardRef(() => MediaModule),
    forwardRef(() =>MembersModule),
  ],
  controllers: [FacialSearchController],
  providers: [
    FaceEmbeddingRepository,
    FaceEmbeddingService,
    FacialSearchService,
  ],
  exports: [
    FaceEmbeddingService,
    FacialSearchService,
  ],
})
export class FacialSearchModule {}