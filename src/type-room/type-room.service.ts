import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTypeRoomDto } from './dto/create-type-room.dto';
import { UpdateTypeRoomDto } from './dto/update-type-room.dto';
import { TypeRoom, TypeRoomDocument } from './schemas/type-room.schema';

@Injectable()
export class TypeRoomService {
  constructor(
    @InjectModel(TypeRoom.name) private typeRoomModel: Model<TypeRoomDocument>,
  ) {}

  async create(createTypeRoomDto: CreateTypeRoomDto): Promise<TypeRoom> {
    const newTypeRoom = new this.typeRoomModel(createTypeRoomDto);
    return newTypeRoom.save();
  }

  async findAll(): Promise<TypeRoom[]> {
    return this.typeRoomModel.find().exec();
  }

  async findOne(id: string): Promise<TypeRoom> {
    const typeRoom = await this.typeRoomModel.findById(id).exec();
    if (!typeRoom) {
      throw new NotFoundException(`TypeRoom with ID ${id} not found`);
    }
    return typeRoom;
  }

  async update(
    id: string,
    updateTypeRoomDto: UpdateTypeRoomDto,
  ): Promise<TypeRoom> {
    const updatedTypeRoom = await this.typeRoomModel
      .findByIdAndUpdate(id, updateTypeRoomDto, { new: true })
      .exec();
    if (!updatedTypeRoom) {
      throw new NotFoundException(`TypeRoom with ID ${id} not found`);
    }
    return updatedTypeRoom;
  }

  async remove(id: string): Promise<void> {
    const result = await this.typeRoomModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`TypeRoom with ID ${id} not found`);
    }
  }
}
