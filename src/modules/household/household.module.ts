import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HouseholdController } from './controller/household.controller';
import { HouseholdService } from './service/household.service';
import { HouseholdRepository } from './repository/household.repository';
import { Household, HouseholdSchema } from './schema/household.schema';

// Các module liên quan nếu có (ví dụ: BranchModule, AccountsModule,...)
import { BranchModule } from '../branch/branch.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Household.name, schema: HouseholdSchema }]),
    forwardRef(() => BranchModule),
    forwardRef(() => AccountsModule),
  ],
  controllers: [HouseholdController],
  providers: [HouseholdService, HouseholdRepository],
  exports: [HouseholdService, HouseholdRepository],
})
export class HouseholdModule {}
