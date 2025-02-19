import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { Discount, DiscountSchema } from './schemas/discount.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Discount.name, schema: DiscountSchema },
    ]),
  ],
  providers: [DiscountService],
  exports: [DiscountService, MongooseModule], // Export để BookingModule có thể sử dụng
})
export class DiscountModule {}
