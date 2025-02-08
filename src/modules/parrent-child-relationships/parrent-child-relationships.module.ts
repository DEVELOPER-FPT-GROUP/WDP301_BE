import { Module } from '@nestjs/common';
import { ParrentChildRelationshipsService } from './parrent-child-relationships.service';
import { ParrentChildRelationshipsController } from './parrent-child-relationships.controller';

@Module({
  controllers: [ParrentChildRelationshipsController],
  providers: [ParrentChildRelationshipsService],
})
export class ParrentChildRelationshipsModule {}
