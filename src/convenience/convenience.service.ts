import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Convenience, ConvenienceDocument } from './schemas/convenience.schema';

@Injectable()
export class ConvenienceService {
  constructor(
    @InjectModel(Convenience.name)
    private convenienceModel: Model<ConvenienceDocument>,
  ) {}

  async create(createDto: { name: string }) {
    const newConvenience = new this.convenienceModel(createDto);
    return newConvenience.save();
  }

  async findAll() {
    return this.convenienceModel.find().exec();
  }

  async findById(id: string) {
    return this.convenienceModel.findById(id).exec();
  }

  async update(id: string, updateDto: { name?: string }) {
    return this.convenienceModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async delete(id: string) {
    return this.convenienceModel.findByIdAndDelete(id).exec();
  }
}
