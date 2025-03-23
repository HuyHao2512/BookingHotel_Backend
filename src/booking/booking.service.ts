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
import { TemplockService } from 'src/templock/templock.service';
import { Room, RoomDocument } from 'src/room/schemas/room.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from 'src/email/email.service';
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

  // async create(createBookingDto: CreateBookingDto): Promise<Booking> {
  //   const userId = createBookingDto.user;
  //   let { totalPrice, discount } = createBookingDto;
  //   const checkInDate = new Date(createBookingDto.checkIn);
  //   const checkOutDate = new Date(createBookingDto.checkOut);
  //   const roomRequests = createBookingDto.rooms;
  //   const roomIds = roomRequests.map((r) => r.room);

  //   const rooms = await this.roomModel.find({ _id: { $in: roomIds } }).lean();
  //   if (rooms.length !== roomIds.length) {
  //     throw new BadRequestException('One or more rooms do not exist');
  //   }
  //   const propertyIds = [
  //     ...new Set(rooms.map((room) => room.property.toString())),
  //   ];

  //   if (propertyIds.length > 1) {
  //     throw new BadRequestException(
  //       'All rooms must belong to the same property',
  //     );
  //   }
  //   const propertyId = propertyIds[0];
  //   const bookingRooms = roomRequests.map((roomRequest) => {
  //     const room = rooms.find((r) => r._id.toString() === roomRequest.room);
  //     if (!room)
  //       throw new BadRequestException(`Room ${roomRequest.room} not found`);
  //     if (room.quantity < roomRequest.quantity) {
  //       throw new BadRequestException(
  //         `Not enough rooms available for ${room.name}`,
  //       );
  //     }
  //     return {
  //       room: room._id,
  //       name: room.name,
  //       quantity: roomRequest.quantity,
  //     };
  //   });
  //   if (checkInDate >= checkOutDate) {
  //     throw new BadRequestException(
  //       'Check-out date must be after check-in date',
  //     );
  //   }
  //   if (checkInDate < new Date()) {
  //     throw new BadRequestException('Check-in date cannot be in the past');
  //   }
  //   let finalPrice = totalPrice;
  //   let discountId = null;
  //   if (discount) {
  //     const discountData = await this.discountService.findOne(
  //       discount.toString(),
  //     );
  //     if (discountData && discountData.isActive) {
  //       finalPrice -= (finalPrice * discountData.percentage) / 100;
  //       discountId = new Types.ObjectId(discount);
  //     }
  //   }
  //   for (const roomRequest of roomRequests) {
  //     const room = rooms.find((r) => r._id.toString() === roomRequest.room);
  //     room.quantity -= roomRequest.quantity;
  //     await this.roomModel.updateOne(
  //       { _id: room._id },
  //       { $inc: { quantity: -roomRequest.quantity } },
  //     );
  //   }
  //   const newBooking = new this.bookingModel({
  //     user: userId,
  //     property: propertyId,
  //     rooms: bookingRooms,
  //     finalPrice,
  //     totalPrice,
  //     discount: discountId,
  //     checkIn: checkInDate,
  //     checkOut: checkOutDate,
  //     paymentMethod: createBookingDto.paymentMethod,
  //     email: createBookingDto.email,
  //   });

  //   try {
  //     const confirmationToken = randomBytes(32).toString('hex');
  //     newBooking.confirmationToken = confirmationToken;
  //     const savedBooking = await newBooking.save();
  //     const confirmLink = `${process.env.FRONTEND_URL}/confirm-booking/${newBooking._id}?token=${confirmationToken}`;
  //     await this.emailService.sendMail(
  //       createBookingDto.email,
  //       'Confirm Your Booking',
  //       `
  //         <p>Dear customer,</p>
  //         <p>Your booking has been received. Click the link below to confirm your booking:</p>
  //         <a href="${confirmLink}" target="_blank">Confirm Booking</a>
  //       `,
  //     );

  //     return savedBooking;
  //   } catch (error) {
  //     for (const roomRequest of roomRequests) {
  //       await this.roomModel.updateOne(
  //         { _id: roomRequest.room },
  //         { $inc: { quantity: roomRequest.quantity } },
  //       );
  //     }
  //     throw error;
  //   }
  // }
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

    // Kiểm tra số phòng đã đặt trong khoảng thời gian này
    for (const roomRequest of roomRequests) {
      const room = rooms.find((r) => r._id.toString() === roomRequest.room);
      if (!room)
        throw new BadRequestException(`Room ${roomRequest.room} not found`);

      // Lấy danh sách đặt phòng trùng thời gian
      const existingBookings = await this.bookingModel.find({
        'rooms.room': room._id,
        checkIn: { $lt: checkOutDate }, // Phòng đã đặt có ngày checkIn trước ngày checkOut của đơn mới
        checkOut: { $gt: checkInDate },
      });

      // Tính tổng số phòng đã được đặt trong khoảng thời gian này
      const bookedQuantity = existingBookings.reduce((sum, booking) => {
        const bookedRoom = booking.rooms.find(
          (r) => r.room.toString() === roomRequest.room,
        );
        return bookedRoom ? sum + bookedRoom.quantity : sum;
      }, 0);

      // Kiểm tra nếu tổng số phòng đã đặt vượt quá totalRoom
      if (bookedQuantity + roomRequest.quantity > room.totalRoom) {
        throw new BadRequestException(
          `Not enough available rooms for ${room.name} during the selected period`,
        );
      }
    }

    // Tiếp tục tạo đặt phòng nếu còn đủ phòng
    const bookingRooms = roomRequests.map((roomRequest) => {
      const room = rooms.find((r) => r._id.toString() === roomRequest.room);
      return {
        room: room._id,
        name: room.name,
        quantity: roomRequest.quantity,
        price: roomRequest.price,
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

    // Không giảm số lượng phòng ngay lập tức, chỉ lưu thông tin đặt phòng
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
      name: createBookingDto.name,
      phone: createBookingDto.phone,
      propertyName: createBookingDto.propertyName,
      description: createBookingDto.description,
    });

    try {
      // const confirmationToken = randomBytes(32).toString('hex');
      // newBooking.confirmationToken = confirmationToken;
      const savedBooking = await newBooking.save();

      // const confirmLink = `${process.env.FRONTEND_URL}/confirm-booking/${newBooking._id}?token=${confirmationToken}`;

      // Tạo danh sách phòng từ dữ liệu booking
      const roomsList = newBooking.rooms
        .map(
          (room) => `
  <tr>
    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${room.name}</td>
    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${room.quantity}</td>
    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${room.price.toLocaleString()} VND</td>
  </tr>
`,
        )
        .join('');

      await this.emailService.sendMail(
        newBooking.email,
        'Thông tin đặt phòng của bạn tại ' + newBooking.propertyName,
        `
    <table style="width: 100%; background-color: #f9f9f9; padding: 20px;">
      <tr>
        <td align="center">
          <table style="max-width: 600px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <img src="https://res.cloudinary.com/dsfajbqyx/image/upload/v1741069874/t27rkfzasuv6jnswqjhl.png" alt="Hotel Logo" width="150">
              </td>
            </tr>
            <tr>
              <td align="center">
                <h2 style="color: #333;">Xác nhận đặt phòng của bạn</h2>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 20px; font-size: 16px; color: #555;">
                <p>Chào <strong>${newBooking.name}</strong>,</p>
                <p>Cảm ơn bạn đã đặt phòng tại <strong>${newBooking.propertyName}</strong>.</p>
                <p>Dưới đây là thông tin đặt phòng của bạn:</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Khách sạn:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${newBooking.propertyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Ngày nhận phòng:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(newBooking.checkIn).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Ngày trả phòng:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(newBooking.checkOut).toLocaleDateString()}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 20px;">
                <h3>Chi tiết phòng</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                  <tr style="background-color: #f2f2f2;">
                    <th style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">Loại phòng</th>
                    <th style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">Số lượng</th>
                    <th style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Giá</th>
                  </tr>
                  ${roomsList}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 20px;">
                <p><strong>Tổng tiền: </strong> <span style="color: #007bff;">${newBooking.finalPrice.toLocaleString()} VND</span></p>
                <p><strong>Phương thức thanh toán: </strong> ${newBooking.paymentMethod === '1' ? 'Thanh toán khi nhận phòng' : 'Thanh toán online'}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 20px;">
                <p>
                  Vui lòng xuất trình đơn đặt phòng này khi đến khách sạn để nhận phòng. Bạn chỉ nhận được phòng khi xuất trình đầy đủ thông tin đặt phòng.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 20px; font-size: 14px; color: #888;">
                <p>Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua số điện thoại <strong>${newBooking.phone}</strong> hoặc email <strong>${newBooking.email}</strong>.</p>
                <p>Trân trọng</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `,
      );

      return savedBooking;
    } catch (error) {
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
    status: 'pending' | 'confirmed' | 'cancelled',
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

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    const bookings = await this.bookingModel
      .find({ user: userId })
      .populate('property rooms.room');

    return bookings.length ? bookings : [];
  }

  async getBookingsByProperty(propertyId: string): Promise<Booking[]> {
    const bookings = await this.bookingModel
      .find({ property: propertyId })
      .populate('user rooms.room');

    if (!bookings.length) {
      return [];
    }
    return bookings;
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

  @Cron('0 0 * * *') // Chạy vào 00:00 mỗi ngày
  async updateRoomAvailability() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = await this.bookingModel.find({ checkIn: today });

    for (const booking of bookings) {
      for (const room of booking.rooms) {
        await this.roomModel.updateOne(
          { _id: room.room },
          { $inc: { quantity: -room.quantity } }, // Giảm số phòng khi check-in
        );
      }
    }
  }
}
