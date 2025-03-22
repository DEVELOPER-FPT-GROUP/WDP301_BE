import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Branch, BranchSchema } from './schema/branch.schema';
import { BranchController } from './controller/branch.controller';
import { BranchService } from './service/branch.service';
import { BranchRepository } from './repository/branch.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Branch.name, schema: BranchSchema }]),
  ],
  controllers: [BranchController],
  providers: [BranchService, BranchRepository],
  exports: [BranchService, BranchRepository],
})
export class BranchModule {}
