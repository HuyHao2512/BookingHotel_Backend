import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Discount, DiscountSchema } from './schemas/discount.schema';
import {
  DiscountUsage,
  DiscountUsageSchema,
} from 'src/discount-usage/schemas/discount-usage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Discount.name, schema: DiscountSchema },
      { name: DiscountUsage.name, schema: DiscountUsageSchema },
    ]),
  ],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [DiscountService],
})
export class DiscountModule {}
