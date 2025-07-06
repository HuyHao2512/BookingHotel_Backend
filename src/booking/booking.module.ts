import { forwardRef, Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Room, RoomSchema } from 'src/room/schemas/room.schema';
import { Discount, DiscountSchema } from 'src/discount/schemas/discount.schema';
import { DiscountModule } from 'src/discount/discount.module';
import { TemplockModule } from 'src/templock/templock.module';
import { RoomModule } from 'src/room/room.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Room.name, schema: RoomSchema }, // Include if RoomModule doesn't export Room model
      { name: Discount.name, schema: DiscountSchema }, // Include if DiscountModule doesn't export Discount model
    ]),
    DiscountModule,
    TemplockModule,
    forwardRef(() => RoomModule),
    ScheduleModule.forRoot(),
    EmailModule,
  ],
  providers: [BookingService], // Only BookingService here
  controllers: [BookingController],
})
export class BookingModule {}
