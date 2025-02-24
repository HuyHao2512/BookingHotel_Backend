import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Booking, BookingDocument } from 'src/booking/schemas/booking.schema';
import { City } from 'src/city/schemas/city.schema';
import { Property } from 'src/property/schemas/property.schema';
import { TypeRoom } from 'src/type-room/schemas/type-room.schema';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(City.name) private cityModel: Model<mongoose.Document>,
    @InjectModel(Property.name) private propertyModel: Model<mongoose.Document>,
    @InjectModel(TypeRoom.name) private typeRoomModel: Model<mongoose.Document>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createRoomDto: CreateRoomDto, files: Express.Multer.File[]) {
    const images = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'rooms',
        );
        images.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      }
    }
    if (typeof createRoomDto.conveniences === 'string') {
      try {
        createRoomDto.conveniences = (createRoomDto.conveniences as any)
          .replace(/\[|\]/g, '')
          .split(',')
          .map((id) => id.trim())
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));
      } catch (error) {
        throw new BadRequestException('Invalid conveniences format');
      }
    }
    const newRoom = new this.roomModel({
      ...createRoomDto,
      images,
    });

    return newRoom.save();
  }

  async findAll(): Promise<Room[]> {
    const rooms = await this.roomModel.aggregate([
      {
        $lookup: {
          from: 'conveniences',
          localField: 'conveniences',
          foreignField: '_id',
          as: 'conveniences',
        },
      },
    ]);
    return this.roomModel.populate(rooms, [
      { path: 'property' },
      { path: 'roomtype' },
    ]);
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
    startDateStr: string,
    endDateStr: string,
    city: string,
    sortOrder?: 'asc' | 'desc',
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
          bookedCount: { $sum: 1 },
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
        const remainingRooms = Math.max(room.totalRoom - bookedCount, 0);
        return { ...room, remainingRooms };
      })
      .filter((room) => room.remainingRooms > 0);
    const totalAvailable = availableRooms.length;
    if (sortOrder) {
      availableRooms.sort((a, b) => {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      });
    }
    return { availableRooms, totalAvailable };
  }

  async findByProperty(propertyId: string) {
    const rooms = await this.roomModel
      .find({ property: propertyId }) // Lọc theo propertyId
      .populate('property') // Populate để lấy thông tin property
      .exec();

    if (!rooms.length) {
      throw new NotFoundException('No rooms found for this property');
    }

    return rooms;
  }

  async findAvailableRoomsOfProperty(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
  ) {
    // Tìm tất cả các phòng thuộc property
    const rooms = await this.roomModel.find({ property: propertyId }).exec();

    if (!rooms.length) {
      throw new NotFoundException('No rooms found for this property');
    }

    // Lấy danh sách roomId đã bị đặt trong khoảng ngày
    const bookedRooms = await this.bookingModel
      .find({
        room: { $in: rooms.map((r) => r._id) }, // Lọc theo roomId trong danh sách
        $or: [
          { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }, // Nếu thời gian đặt trùng khoảng checkIn - checkOut
        ],
      })
      .select('room')
      .exec();

    // Danh sách ID phòng đã bị đặt
    const bookedRoomIds = bookedRooms.map((b) => b.rooms.toString());

    // Lọc ra các phòng không có trong danh sách đã đặt
    return rooms.filter((room) => !bookedRoomIds.includes(room._id.toString()));
  }
}
