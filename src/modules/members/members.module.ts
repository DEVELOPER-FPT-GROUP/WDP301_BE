import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersService } from './service/members.service';
import { MembersController } from './controller/members.controller';
import { Member, MemberSchema } from './schema/member.schema';
import { MembersRepository } from './repository/members.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Member.name, schema: MemberSchema }]), // MongoDB integration
  ],
  controllers: [MembersController],
  providers: [MembersService, MembersRepository], // Register service and repository
  exports: [MembersService, MembersRepository], // Allow usage in other modules
})
export class MembersModule {}
