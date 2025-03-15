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

  // async update(id: string, updateRoomDto: CreateRoomDto): Promise<Room> {
  //   const { property, ...updatedData } = updateRoomDto;
  //   return this.roomModel
  //     .findByIdAndUpdate(id, updatedData, {
  //       new: true, // Trả về dữ liệu sau khi update
  //       runValidators: true, // Kiểm tra validation schema
  //     })
  //     .exec();
  // }
  async update(
    id: string,
    updateRoomDto: CreateRoomDto,
    files?: Express.Multer.File[],
    removeImageIds?: string[],
  ) {
    try {
      const existingRoom = await this.roomModel.findById(id);
      if (!existingRoom) {
        throw new NotFoundException('Room not found');
      }

      const { property, ...updatedData } = updateRoomDto;
      let images = existingRoom.images || [];

      // Xóa ảnh cũ
      if (removeImageIds?.length > 0) {
        for (const publicId of removeImageIds) {
          await this.cloudinaryService.deleteImage(publicId);
        }
        images = images.filter((img) => !removeImageIds.includes(img.publicId));
      }

      // Thêm ảnh mới
      if (files && files.length > 0) {
        try {
          const newImages = await Promise.all(
            files.map(async (file) => {
              const uploadResult = await this.cloudinaryService.uploadImage(
                file,
                'rooms',
              );
              return {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
              };
            }),
          );
          images = [...images, ...newImages];
        } catch (uploadError) {
          throw new BadRequestException(
            `Image upload failed: ${uploadError.message}`,
          );
        }
      }

      // Xử lý conveniences
      let conveniences: Types.ObjectId[] = [];
      if (updateRoomDto.conveniences) {
        if (typeof updateRoomDto.conveniences === 'string') {
          try {
            const parsedConveniences = JSON.parse(updateRoomDto.conveniences);
            if (Array.isArray(parsedConveniences)) {
              conveniences = parsedConveniences
                .map((id) => id.trim())
                .filter((id) => Types.ObjectId.isValid(id))
                .map((id) => new Types.ObjectId(id));
            }
          } catch (error) {
            throw new BadRequestException('Invalid conveniences format');
          }
        } else if (Array.isArray(updateRoomDto.conveniences)) {
          conveniences = updateRoomDto.conveniences
            .filter((id) => Types.ObjectId.isValid(id))
            .map((id) => new Types.ObjectId(id));
        }
      }

      // Cập nhật room
      const updatedRoom = await this.roomModel.findByIdAndUpdate(
        id,
        {
          ...updatedData,
          conveniences,
          images,
        },
        { new: true, runValidators: true },
      );

      return updatedRoom;
    } catch (error) {
      throw new BadRequestException(`Error updating room: ${error.message}`);
    }
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
    const rooms = await this.roomModel.aggregate([
      {
        $match: { property: propertyId }, // Lọc theo propertyId
      },
      {
        $lookup: {
          from: 'conveniences',
          localField: 'conveniences',
          foreignField: '_id',
          as: 'conveniences',
        },
      },
    ]);
    const populatedRooms = await this.roomModel.populate(rooms, [
      { path: 'property' },
      { path: 'roomtype' },
    ]);

    if (!populatedRooms.length) {
      throw new NotFoundException('No rooms found for this property');
    }

    return populatedRooms;
  }

  async findAvailableRoomsOfProperty(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
  ) {
    const Listrooms = await this.roomModel.aggregate([
      {
        $match: { property: propertyId }, // Lọc theo propertyId
      },
      {
        $lookup: {
          from: 'conveniences',
          localField: 'conveniences',
          foreignField: '_id',
          as: 'conveniences',
        },
      },
    ]);

    const rooms = await this.roomModel.populate(Listrooms, [
      { path: 'property' },
      { path: 'roomtype' },
    ]);
    if (!rooms.length) {
      throw new NotFoundException('No rooms found for this property');
    }

    // Lấy danh sách đặt phòng trùng ngày
    const bookedRooms = await this.bookingModel
      .find({
        'rooms.room': { $in: rooms.map((r) => r._id) }, // Lọc theo danh sách roomId
        checkIn: { $lt: checkOut }, // Check-in trước thời gian check-out
        checkOut: { $gt: checkIn }, // Check-out sau thời gian check-in
      })
      .select('rooms') // Chỉ lấy danh sách phòng đã đặt
      .lean();

    // Tạo map lưu số lượng phòng đã được đặt trong khoảng thời gian
    const bookedRoomCounts = new Map<string, number>();
    for (const booking of bookedRooms) {
      for (const bookedRoom of booking.rooms) {
        const roomId = bookedRoom.room.toString();
        const quantity = bookedRoom.quantity;
        bookedRoomCounts.set(
          roomId,
          (bookedRoomCounts.get(roomId) || 0) + quantity,
        );
      }
    }

    // Lọc danh sách phòng còn trống dựa trên totalRoom - số lượng đã đặt
    const availableRooms = rooms.filter((room) => {
      const bookedQuantity = bookedRoomCounts.get(room._id.toString()) || 0;
      return bookedQuantity < room.totalRoom; // Nếu số lượng đã đặt nhỏ hơn totalRoom, phòng còn trống
    });

    return availableRooms;
  }
}
