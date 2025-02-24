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
import { EmailService } from 'src/email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private readonly discountService: DiscountService,
    private readonly templockService: TemplockService,
    private readonly emailService: EmailService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const userId = createBookingDto.user;
    let { totalPrice, discount } = createBookingDto;
    const checkInDate = new Date(createBookingDto.checkIn);
    const checkOutDate = new Date(createBookingDto.checkOut);
    const roomRequests = createBookingDto.rooms;
    const roomIds = roomRequests.map((r) => r.room);

    const rooms = await this.roomModel.find({ _id: { $in: roomIds } }).lean();
    if (rooms.length !== roomIds.length) {
      throw new BadRequestException('One or more rooms do not exist');
    }
    const propertyIds = [
      ...new Set(rooms.map((room) => room.property.toString())),
    ];

    if (propertyIds.length > 1) {
      throw new BadRequestException(
        'All rooms must belong to the same property',
      );
    }
    const propertyId = propertyIds[0];
    const bookingRooms = roomRequests.map((roomRequest) => {
      const room = rooms.find((r) => r._id.toString() === roomRequest.room);
      if (!room)
        throw new BadRequestException(`Room ${roomRequest.room} not found`);
      if (room.quantity < roomRequest.quantity) {
        throw new BadRequestException(
          `Not enough rooms available for ${room.name}`,
        );
      }
      return {
        room: room._id,
        name: room.name,
        quantity: roomRequest.quantity,
      };
    });
    if (checkInDate >= checkOutDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }
    if (checkInDate < new Date()) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }
    let finalPrice = totalPrice;
    let discountId = null;
    if (discount) {
      const discountData = await this.discountService.findOne(
        discount.toString(),
      );
      if (discountData && discountData.isActive) {
        finalPrice -= (finalPrice * discountData.percentage) / 100;
        discountId = new Types.ObjectId(discount);
      }
    }
    for (const roomRequest of roomRequests) {
      const room = rooms.find((r) => r._id.toString() === roomRequest.room);
      room.quantity -= roomRequest.quantity;
      await this.roomModel.updateOne(
        { _id: room._id },
        { $inc: { quantity: -roomRequest.quantity } },
      );
    }
    const newBooking = new this.bookingModel({
      user: userId,
      property: propertyId,
      rooms: bookingRooms,
      finalPrice,
      totalPrice,
      discount: discountId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      paymentMethod: createBookingDto.paymentMethod,
      email: createBookingDto.email,
    });

    try {
      const confirmationToken = randomBytes(32).toString('hex');
      newBooking.confirmationToken = confirmationToken;
      const savedBooking = await newBooking.save();
      const confirmLink = `${process.env.FRONTEND_URL}/confirm-booking/${newBooking._id}?token=${confirmationToken}`;
      await this.emailService.sendMail(
        createBookingDto.email,
        'Confirm Your Booking',
        `
          <p>Dear customer,</p>
          <p>Your booking has been received. Click the link below to confirm your booking:</p>
          <a href="${confirmLink}" target="_blank">Confirm Booking</a>
        `,
      );

      return savedBooking;
    } catch (error) {
      for (const roomRequest of roomRequests) {
        await this.roomModel.updateOne(
          { _id: roomRequest.room },
          { $inc: { quantity: roomRequest.quantity } },
        );
      }
      throw error;
    }
  }

  async confirmBooking(bookingId: string, token: string): Promise<void> {
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    if (!booking.confirmationToken || booking.confirmationToken !== token) {
      throw new BadRequestException('Invalid or expired confirmation token');
    }
    booking.status = 'confirmed';
    booking.confirmationToken = null;
    await booking.save();
    console.log('Booking confirmed');
    return;
  }
  async findAll(): Promise<Booking[]> {
    return this.bookingModel
      .find()
      .populate('user')
      .populate({
        path: 'rooms.room', // Populate từng `room` trong mảng `rooms`
        model: 'Room', // Model của room
      })
      .populate('discount')
      .exec();
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
      throw new BadRequestException('Booking not found');
    }

    // Nếu trạng thái không thay đổi, không cần cập nhật
    if (booking.status === status) {
      return booking;
    }

    booking.status = status;

    // Nếu xác nhận booking, giải phóng khóa tạm thời của tất cả phòng
    if (status === 'confirmed') {
      const roomIds = booking.rooms.map((room) => room.room);
      await Promise.all(
        roomIds.map((roomId) =>
          this.templockService.releaseLock(roomId.toString()),
        ),
      );
    }
    return booking.save();
  }

  async releaseRoom(bookingId: string) {
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) throw new BadRequestException('Booking not found');
    // Lấy danh sách ID các phòng từ booking.rooms
    const roomIds = booking.rooms.map((r) => r.room);
    if (booking.status === 'confirmed') {
      throw new BadRequestException('Cannot cancel a confirmed booking');
    }
    // Tìm tất cả phòng tương ứng trong database
    const rooms = await this.roomModel.find({ _id: { $in: roomIds } });
    if (rooms.length === 0) throw new BadRequestException('Rooms not found');
    // Cập nhật số lượng phòng dựa vào số lượng đã đặt
    await Promise.all(
      rooms.map(async (room) => {
        const bookedRoom = booking.rooms.find(
          (r) => r.room.toString() === room._id.toString(),
        );
        if (bookedRoom) {
          room.quantity += bookedRoom.quantity; // Cộng lại số lượng phòng đã đặt
        }
        if (room.quantity > 0) {
          await this.templockService.releaseLock(room._id.toString());
        }
        await room.save();
      }),
    );
    // Xóa booking sau khi phòng được giải phóng
    await this.bookingModel.deleteOne({ _id: bookingId });

    return { message: 'Booking canceled, rooms released successfully' };
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

    if (bookingsToCancel.length === 0) {
      this.logger.log('No bookings to cancel.');
      return;
    }

    await Promise.all(
      bookingsToCancel.map(async (booking) => {
        this.logger.warn(`Auto-canceling booking ID: ${booking._id}`);

        // Đảm bảo room là mảng
        const roomIds = Array.isArray(booking.rooms)
          ? booking.rooms
          : [booking.rooms];

        const rooms = await this.roomModel.find({ _id: { $in: roomIds } });

        if (rooms.length > 0) {
          await Promise.all(
            rooms.map(async (room) => {
              room.quantity += 1;
              await room.save();
              await this.templockService.releaseLock(room._id.toString());
            }),
          );
        }

        // Xóa booking
        await this.bookingModel.deleteOne({ _id: booking._id });
      }),
    );

    this.logger.log(
      `Canceled ${bookingsToCancel.length} unconfirmed bookings.`,
    );
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    const bookings = await this.bookingModel
      .find({ user: userId })
      .populate('property rooms.room');
    if (!bookings.length) {
      throw new BadRequestException('No bookings found for this user');
    }
    return bookings;
  }

  async getBookingsByProperty(propertyId: string): Promise<Booking[]> {
    const bookings = await this.bookingModel
      .find({ property: propertyId })
      .populate('user rooms.room');

    if (!bookings.length) {
      throw new BadRequestException('No bookings found for this property');
    }
    return bookings;
  }
}
