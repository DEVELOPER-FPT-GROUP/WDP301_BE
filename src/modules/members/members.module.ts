import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersService } from './service/members.service';
import { MembersController } from './controller/members.controller';
import { Member, MemberSchema } from './schema/member.schema';
import { MembersRepository } from './repository/members.repository';
import { FamiliesModule } from '../families/families.module';
import { MarriagesModule } from '../marriages/marriages.module';
import { ParentChildRelationshipsModule } from '../parent-child-relationships/parent-child-relationships.module';
import { RelationshipTypesModule } from '../relationship-types/relationship-types.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Member.name, schema: MemberSchema }]),
    FamiliesModule,
    MarriagesModule,
    ParentChildRelationshipsModule,
    RelationshipTypesModule
  ],
  controllers: [MembersController],
  providers: [MembersService, MembersRepository],
  exports: [MembersService, MembersRepository],
})
export class MembersModule {}
