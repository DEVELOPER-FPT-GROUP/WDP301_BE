import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tracking, TrackingSchema } from './schema/tracking.schema';
import { OrdersModule } from '../orders/orders.module';
import { TrackingsController } from './controller/tracking.controller';
import { TrackingsService } from './service/tracking.service';
import { TrackingsRepository } from './repository/tracking.repository';
import { FamiliesModule } from '../families/families.module'; 
import { AccountsModule } from '../accounts/accounts.module'; // ✅ Import AccountsModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tracking.name, schema: TrackingSchema }]),
    forwardRef(() => OrdersModule), 
    forwardRef(() => FamiliesModule), 
    forwardRef(() => AccountsModule), // ✅ Use forwardRef() for AccountsModule
  ],
  controllers: [TrackingsController],
  providers: [TrackingsService, TrackingsRepository],
  exports: [TrackingsService, TrackingsRepository], // ✅ Export TrackingsService
})
export class TrackingsModule {}
