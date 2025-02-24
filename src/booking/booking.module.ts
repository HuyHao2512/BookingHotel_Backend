import { forwardRef, Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { DiscountService } from 'src/discount/discount.service';
import { DiscountModule } from 'src/discount/discount.module';
import { TemplockService } from 'src/templock/templock.service';
import { TemplockModule } from 'src/templock/templock.module';
import { RoomModule } from 'src/room/room.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from 'src/email/email.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    DiscountModule,
    TemplockModule,
    forwardRef(() => RoomModule),
    ScheduleModule.forRoot(),
    EmailModule,
  ],
  providers: [BookingService, DiscountService],
  controllers: [BookingController],
})
export class BookingModule {}
