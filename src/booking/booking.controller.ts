import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/auth/enum';
import { Public } from 'src/decorator/customize';
import { RoomService } from 'src/room/room.service';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @Roles(Role.User)
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.bookingService.findAll();
  }

  //User, Owner, Admin có thể xem một booking cụ thể
  @Get(':id')
  @Roles(Role.User, Role.Owner, Role.Admin)
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(id);
  }

  @Patch('/status/:id')
  @Roles(Role.User)
  async updateBookingStatus(
    @Param('id') id: string,
    @Body('status') status: 'pending' | 'confirmed',
  ) {
    return this.bookingService.updateBookingStatus(id, status);
  }

  @Patch('/release-room/:bookingId')
  @Roles(Role.User, Role.Owner, Role.Admin)
  async releaseRoom(@Param('bookingId') bookingId: string) {
    return this.bookingService.releaseRoom(bookingId);
  }
}
