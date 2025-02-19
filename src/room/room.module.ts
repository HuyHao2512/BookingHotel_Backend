import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule, Prop } from '@nestjs/mongoose';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { TypeRoomModule } from '../type-room/type-room.module'; // Import TypeRoomModule nếu cần liên kết
import { AmenityModule } from 'src/amenity/amenity.module';
import { ConvenienceModule } from 'src/convenience/convenience.module';
import { BookingModule } from 'src/booking/booking.module';
import { Booking, BookingSchema } from 'src/booking/schemas/booking.schema';
import { CityModule } from 'src/city/city.module';
import { Property, PropertySchema } from 'src/property/schemas/property.schema';
import { Mongoose } from 'mongoose';
import { City, CitySchema } from 'src/city/schemas/city.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
    ]),
    MongooseModule.forFeature([{ name: City.name, schema: CitySchema }]),
    TypeRoomModule,
    AmenityModule,
    ConvenienceModule,
    BookingModule,
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    RoomService,
  ], // Export RoomService nếu cần dùng ở module khác
})
export class RoomModule {}
