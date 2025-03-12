import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParentChildRelationshipsController } from './controller/parent-child-relationships.controller';
import { ParentChildRelationship, ParentChildRelationshipSchema } from './schema/parent-child-relationship.schema';
import { ParentChildRelationshipsService } from './service/parent-child-relationships.service';
import { ParentChildRelationshipsRepository } from './repository/parent-child-relationships.repository';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParentChildRelationship.name, schema: ParentChildRelationshipSchema }
    ]),
    forwardRef(() => MembersModule)
  ],
  controllers: [ParentChildRelationshipsController],
  providers: [ParentChildRelationshipsService, ParentChildRelationshipsRepository],
  exports: [ParentChildRelationshipsService, ParentChildRelationshipsRepository],
})
export class ParentChildRelationshipsModule {}
