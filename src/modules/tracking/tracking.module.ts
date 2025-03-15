import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tracking, TrackingSchema } from './schema/tracking.schema';
import { OrdersModule } from '../orders/orders.module';
import { TrackingsController } from './controller/tracking.controller';
import { TrackingsService } from './service/tracking.service';
import { TrackingsRepository } from './repository/tracking.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tracking.name, schema: TrackingSchema }]),
    forwardRef(() => OrdersModule), // Prevent circular dependency
  ],
  controllers: [TrackingsController],
  providers: [TrackingsService, TrackingsRepository],
  exports: [TrackingsService], // Export TrackingsService for OrdersModule
})
export class TrackingsModule {}
