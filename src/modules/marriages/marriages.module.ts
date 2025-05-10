import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarriagesService } from './service/marriages.service';
import { MarriagesController } from './controller/marriages.controller';
import { Marriage, MarriageSchema } from './schema/marriage.schema';
import { MarriagesRepository } from './repository/marriages.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Marriage.name, schema: MarriageSchema }]), // MongoDB Schema
  ],
  controllers: [MarriagesController], // API Endpoints
  providers: [MarriagesService, MarriagesRepository], // Business logic & database operations
  exports: [MarriagesService, MarriagesRepository], // Allow usage in other modules
})
export class MarriagesModule {}
