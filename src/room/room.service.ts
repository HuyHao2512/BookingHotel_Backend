import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Booking, BookingDocument } from 'src/booking/schemas/booking.schema';
import { City } from 'src/city/schemas/city.schema';
import { Property } from 'src/property/schemas/property.schema';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(City.name) private cityModel: Model<mongoose.Document>,
    @InjectModel(Property.name) private propertyModel: Model<mongoose.Document>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createRoomDto: CreateRoomDto, files: Express.Multer.File[]) {
    const images = [];

    // Kiểm tra và upload các file hình ảnh
    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'rooms', // Folder trên Cloudinary
        );
        images.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      }
    }

    // Tạo một instance Room mới với dữ liệu từ DTO và danh sách hình ảnh
    const newRoom = new this.roomModel({
      ...createRoomDto,
      images,
    });

    return newRoom.save(); // Lưu Room mới vào database
  }

  async findAll(): Promise<Room[]> {
    return this.roomModel
      .find()
      .populate('property') // Lấy thông tin property
      .populate('conveniences') // Lấy thông tin conveniences
      .exec();
  }

  async findById(id: string): Promise<Room> {
    return this.roomModel
      .findById(id)
      .populate('property')
      .populate('conveniences')
      .exec();
  }

  async delete(id: string): Promise<Room> {
    return this.roomModel.findByIdAndDelete(id).exec();
  }

  async update(id: string, updateRoomDto: CreateRoomDto): Promise<Room> {
    return this.roomModel
      .findByIdAndUpdate(id, updateRoomDto, { new: true })
      .exec();
  }
  async findAvailableRooms(
    startDateStr: string, // Nhận dạng chuỗi từ request
    endDateStr: string,
    city: string,
  ): Promise<{ availableRooms: Room[]; totalAvailable: number }> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      throw new Error('Invalid date input');
    }
    const cityDoc = await this.cityModel.findOne({ name: city });
    if (!cityDoc) {
      throw new Error('City not found');
    }
    const bookedRooms = await this.bookingModel.aggregate([
      {
        $match: {
          $or: [{ checkIn: { $lte: endDate }, checkOut: { $gte: startDate } }],
        },
      },
      {
        $group: {
          _id: '$room',
          bookedCount: { $sum: 1 }, // Đếm số lần phòng này đã được đặt
        },
      },
    ]);
    console.log('Booked Rooms:', bookedRooms);
    const bookedRoomMap = new Map(
      bookedRooms.map((booking) => [
        booking._id.toString(),
        booking.bookedCount,
      ]),
    );
    const properties = await this.propertyModel.find({
      city: cityDoc._id.toString(),
    });
    const propertyIds = properties.map((property) => property._id.toString());
    let allRooms = await this.roomModel
      .find({
        property: { $in: propertyIds },
        isAvailable: true,
      })
      .lean();
    const availableRooms = allRooms
      .map((room) => {
        const bookedCount = bookedRoomMap.get(room._id.toString()) || 0;
        const remainingRooms = Math.max(room.totalRoom - bookedCount, 0); // Số lượng phòng còn trống
        return { ...room, remainingRooms }; // Thêm remainingRooms vào kết quả
      })
      .filter((room) => room.remainingRooms > 0); // Chỉ giữ lại phòng còn trống

    console.log('Available Rooms:', availableRooms);
    const totalAvailable = availableRooms.length;
    return { availableRooms, totalAvailable };
  }
}
