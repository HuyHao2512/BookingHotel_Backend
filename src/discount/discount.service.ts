import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discount, DiscountDocument } from './schemas/discount.schema';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel(Discount.name) private discountModel: Model<DiscountDocument>,
  ) {}

  async create(createDiscountDto: CreateDiscountDto): Promise<Discount> {
    const newDiscount = new this.discountModel(createDiscountDto);
    return newDiscount.save();
  }

  async findAll(): Promise<Discount[]> {
    return this.discountModel.find().exec();
  }

  async findOne(code: string): Promise<Discount> {
    const discount = await this.discountModel.findOne({ code }).exec();
    if (!discount) throw new NotFoundException('Mã giảm giá không tồn tại');
    return discount;
  }

  async update(
    code: string,
    updateDiscountDto: UpdateDiscountDto,
  ): Promise<Discount> {
    const updatedDiscount = await this.discountModel
      .findOneAndUpdate({ code }, updateDiscountDto, { new: true })
      .exec();
    if (!updatedDiscount)
      throw new NotFoundException('Mã giảm giá không tồn tại');
    return updatedDiscount;
  }

  async remove(code: string): Promise<void> {
    const result = await this.discountModel.findOneAndDelete({ code }).exec();
    if (!result) throw new NotFoundException('Mã giảm giá không tồn tại');
  }
}
