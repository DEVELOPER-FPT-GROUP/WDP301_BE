import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamiliesController } from './controller/families.controller';
import { FamiliesService } from './service/families.service';
import { Family, FamilySchema } from './schema/family.schema';
import { FamiliesRepository } from './repository/families.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Family.name, schema: FamilySchema }]),
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService, FamiliesRepository],
  exports: [FamiliesService, FamiliesRepository],
})
export class FamiliesModule {}
