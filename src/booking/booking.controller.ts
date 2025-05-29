import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/auth/enum';
import { Public } from 'src/decorator/customize';
import { Response } from 'express';

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
  @Get('confirm/:bookingId')
  @Roles(Role.User)
  async confirmBooking(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    try {
      await this.bookingService.confirmBooking(bookingId, token);
      return res.redirect(`${process.env.FRONTEND_URL}/confirmation-success`);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('/user/:userId')
  @Roles(Role.User, Role.Owner, Role.Admin)
  async getBookingsByUser(@Param('userId') userId: string) {
    try {
      return await this.bookingService.getBookingsByUser(userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('property/:propertyId')
  @Roles(Role.Owner, Role.Admin)
  async getBookingsByProperty(@Param('propertyId') propertyId: string) {
    try {
      return await this.bookingService.getBookingsByProperty(propertyId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('property-revenue')
  @Roles(Role.Owner, Role.Admin)
  @Get('monthly-stats')
  async getMonthlyStatistics(@Query('propertyId') propertyId: string) {
    return await this.bookingService.getMonthlyStatistics(propertyId);
  }

  @Get(':id')
  @Roles(Role.User, Role.Owner, Role.Admin)
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(id);
  }

  @Patch('/status/:id')
  @Roles(Role.Owner)
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
