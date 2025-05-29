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
      return [];
    }

    return populatedRooms;
  }

  // async findAvailableRoomsOfProperty(
  //   propertyId: string,
  //   checkIn: Date,
  //   checkOut: Date,
  // ) {
  //   const Listrooms = await this.roomModel.aggregate([
  //     {
  //       $match: { property: propertyId }, // Lọc theo propertyId
  //     },
  //     {
  //       $lookup: {
  //         from: 'conveniences',
  //         localField: 'conveniences',
  //         foreignField: '_id',
  //         as: 'conveniences',
  //       },
  //     },
  //   ]);

  //   const rooms = await this.roomModel.populate(Listrooms, [
  //     { path: 'property' },
  //     { path: 'roomtype' },
  //   ]);
  //   if (!rooms.length) {
  //     return [];
  //   }

  //   // Lấy danh sách đặt phòng trùng ngày
  //   const bookedRooms = await this.bookingModel
  //     .find({
  //       'rooms.room': { $in: rooms.map((r) => r._id) }, // Lọc theo danh sách roomId
  //       checkIn: { $lt: checkOut }, // Check-in trước thời gian check-out
  //       checkOut: { $gt: checkIn }, // Check-out sau thời gian check-in
  //     })
  //     .select('rooms') // Chỉ lấy danh sách phòng đã đặt
  //     .lean();

  //   // Tạo map lưu số lượng phòng đã được đặt trong khoảng thời gian
  //   const bookedRoomCounts = new Map<string, number>();
  //   for (const booking of bookedRooms) {
  //     for (const bookedRoom of booking.rooms) {
  //       const roomId = bookedRoom.room.toString();
  //       const quantity = bookedRoom.quantity;
  //       bookedRoomCounts.set(
  //         roomId,
  //         (bookedRoomCounts.get(roomId) || 0) + quantity,
  //       );
  //     }
  //   }

  //   // Lọc danh sách phòng còn trống dựa trên totalRoom - số lượng đã đặt
  //   const availableRooms = rooms.filter((room) => {
  //     const bookedQuantity = bookedRoomCounts.get(room._id.toString()) || 0;
  //     return bookedQuantity < room.totalRoom; // Nếu số lượng đã đặt nhỏ hơn totalRoom, phòng còn trống
  //   });

  //   return availableRooms;
  // }
  async findAvailableRoomsOfProperty(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
  ) {
    //Lấy danh sách phòng của property kèm conveniences
    const Listrooms = await this.roomModel.aggregate([
      {
        $match: { property: propertyId },
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
      return [];
    }

    //Lấy danh sách phòng đã đặt trong khoảng thời gian checkIn - checkOut
    const bookedRooms = await this.bookingModel
      .find({
        'rooms.room': { $in: rooms.map((r) => r._id) },
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
      })
      .select('rooms')
      .lean();

    //Tính tổng số lượng phòng đã đặt theo roomId
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

    //Tạo danh sách phòng còn trống kèm số lượng phòng trống
    const availableRooms = rooms
      .map((room) => {
        const bookedQuantity = bookedRoomCounts.get(room._id.toString()) || 0;
        const availableRoomCount = room.totalRoom - bookedQuantity;

        return {
          ...room,
          availableRoomCount,
        };
      })
      .filter((room) => room.availableRoomCount > 0); // Chỉ lấy phòng còn trống

    return availableRooms;
  }
}
