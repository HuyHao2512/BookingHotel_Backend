import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { DiscountService } from '../discount/discount.service';
import { RoomService } from 'src/room/room.service';
import { TemplockService } from 'src/templock/templock.service';
import { Room, RoomDocument } from 'src/room/schemas/room.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private readonly discountService: DiscountService,
    private readonly templockService: TemplockService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const roomId = createBookingDto.room;
    const userId = createBookingDto.user;
    let { totalPrice, discount } = createBookingDto;
    const checkInDate = new Date(createBookingDto.checkIn);
    const checkOutDate = new Date(createBookingDto.checkOut);
    // Lấy thông tin phòng
    const roomData = await this.roomModel.findById(roomId);
    if (!roomData) throw new BadRequestException('Room not found');
    if (roomData.quantity <= 0)
      throw new BadRequestException('Room is sold out');
    // Nếu chỉ còn 1 phòng thì kiểm tra lock
    if (roomData.quantity === 1) {
      const lock = await this.templockService.isRoomLocked(roomId.toString());
      if (lock) {
        throw new BadRequestException('Room is locked and cannot be booked');
      }
      await this.templockService.lockRoom(roomId.toString(), userId.toString());
    }
    //Kiểm tra thời gian check-in/check-out
    if (checkInDate >= checkOutDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }
    if (checkInDate < new Date()) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }
    //Kiểm tra giảm giá
    let finalPrice = totalPrice;
    let discountId = null;
    if (discount) {
      const discountData = await this.discountService.findOne(
        discount.toString(),
      );
      if (discountData && discountData.isActive) {
        finalPrice = finalPrice - (finalPrice * discountData.percentage) / 100;
        discountId = new Types.ObjectId(discount);
      }
    }
    //Giảm quantity sau khi đặt phòng thành công
    roomData.quantity -= 1;
    await roomData.save();

    // Lưu đơn đặt phòng
    const newBooking = new this.bookingModel({
      ...createBookingDto,
      finalPrice,
      discount: discountId,
    });
    try {
      return await newBooking.save();
    } catch (error) {
      //Nếu có lỗi, hoàn lại số lượng phòng và mở khóa nếu cần
      roomData.quantity += 1;
      if (roomData.quantity === 1) {
        await this.templockService.releaseLock(roomId.toString());
      }
      await roomData.save();
      throw error;
    }
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingModel.find().populate('user room discount').exec();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('user room discount')
      .exec();
    if (!booking) throw new NotFoundException('Đơn đặt phòng không tồn tại');
    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const updatedBooking = await this.bookingModel
      .findByIdAndUpdate(id, updateBookingDto, { new: true })
      .exec();
    if (!updatedBooking)
      throw new NotFoundException('Đơn đặt phòng không tồn tại');
    return updatedBooking;
  }
  async remove(id: string): Promise<void> {
    const result = await this.bookingModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Đơn đặt phòng không tồn tại');
  }
  async updateBookingStatus(
    id: string,
    status: 'pending' | 'confirmed',
  ): Promise<Booking> {
    const booking = await this.bookingModel.findById(id);

    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.status = status;
    if (status === 'confirmed') {
      await this.templockService.releaseLock(booking.room.toString());
    }
    return booking.save();
  }
  async releaseRoom(bookingId: string) {
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) throw new BadRequestException('Booking not found');

    const roomData = await this.roomModel.findById(booking.room);
    if (!roomData) throw new BadRequestException('Room not found');
    roomData.quantity += 1;
    if (roomData.quantity === 1) {
      await this.templockService.releaseLock(roomData._id.toString());
    }
    await roomData.save();

    return this.bookingModel.deleteOne({ _id: bookingId });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoCancelUnconfirmedBookings() {
    this.logger.log('Checking for unconfirmed bookings...');

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Tìm tất cả booking có status = "pending" và được tạo hơn 24h trước
    const bookingsToCancel = await this.bookingModel.find({
      status: 'pending',
      createdAt: { $lte: twentyFourHoursAgo },
    });

    for (const booking of bookingsToCancel) {
      this.logger.warn(`Auto-canceling booking ID: ${booking._id}`);

      // Hoàn lại số lượng phòng
      const room = await this.roomModel.findById(booking.room);
      if (room) {
        room.quantity += 1;
        await room.save();
      }
      // Giải phóng lock phòng nếu có
      await this.templockService.releaseLock(booking.room.toString());
      // Xóa booking
      await this.bookingModel.deleteOne({ _id: booking._id });
    }

    this.logger.log(
      `Canceled ${bookingsToCancel.length} unconfirmed bookings.`,
    );
  }
}
