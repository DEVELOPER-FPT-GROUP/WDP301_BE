import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RelationshipTypesService } from './service/relationship-types.service';
import { RelationshipTypesController } from './controller/relationship-types.controller';
import { RelationshipType, RelationshipTypeSchema } from './schema/relationship-type.schema';
import { RelationshipTypesRepository } from './repository/relationship-types.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RelationshipType.name, schema: RelationshipTypeSchema }]),
  ],
  controllers: [RelationshipTypesController],
  providers: [RelationshipTypesService, RelationshipTypesRepository],
  exports: [RelationshipTypesService, RelationshipTypesRepository],
})
export class RelationshipTypesModule {}
