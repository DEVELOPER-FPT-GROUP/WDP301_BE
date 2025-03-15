import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './controller/orders.controller';
import { OrdersService } from './service/orders.service';
import { OrdersRepository } from './repository/orders.repository';
import { Order, OrderSchema } from './schema/order.schema';
import { TrackingsModule } from '../tracking/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    forwardRef(() => TrackingsModule), // Prevent circular dependency
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService], // Export OrdersService for TrackingsModule
})
export class OrdersModule {}
