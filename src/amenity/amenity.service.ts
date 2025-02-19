import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Amenity, AmenityDocument } from './schemas/amenity.schema';

@Injectable()
export class AmenityService {
  constructor(
    @InjectModel(Amenity.name) private amenityModel: Model<AmenityDocument>,
  ) {}

  async create(createDto: { name: string }) {
    const newAmenity = new this.amenityModel(createDto);
    return newAmenity.save();
  }

  async findAll() {
    return this.amenityModel.find().exec();
  }

  async findById(id: string) {
    return this.amenityModel.findById(id).exec();
  }

  async update(id: string, updateDto: { name?: string }) {
    return this.amenityModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async delete(id: string) {
    return this.amenityModel.findByIdAndDelete(id).exec();
  }
}
