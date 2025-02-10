import { Module } from '@nestjs/common';
import { RelationshipTypesService } from './relationship-types.service';
import { RelationshipTypesController } from './relationship-types.controller';

@Module({
  controllers: [RelationshipTypesController],
  providers: [RelationshipTypesService],
})
export class RelationshipTypesModule {}
