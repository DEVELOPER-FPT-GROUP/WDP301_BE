import { Module } from '@nestjs/common';
import { MarriagesService } from './marriages.service';
import { MarriagesController } from './marriages.controller';

@Module({
  controllers: [MarriagesController],
  providers: [MarriagesService],
})
export class MarriagesModule {}
