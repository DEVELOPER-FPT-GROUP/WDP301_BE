import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsService } from './service/accounts.service';
import { AccountsController } from './controller/accounts.controller';
import { Account, AccountSchema } from './schema/account.schema';
import { AccountsRepository } from './repository/accounts.repository';
import { MembersModule } from '../members/members.module';
import { FamiliesModule } from '../families/families.module';
import { TrackingsModule } from '../tracking/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    forwardRef(() => FamiliesModule),
    forwardRef(() => TrackingsModule),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsService, AccountsRepository],
})
export class AccountsModule {}
