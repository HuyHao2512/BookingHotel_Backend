import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discount, DiscountDocument } from './schemas/discount.schema';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel(Discount.name) private discountModel: Model<DiscountDocument>,
  ) {}

  async create(createDiscountDto: CreateDiscountDto): Promise<Discount> {
    const existing = await this.discountModel.findOne({
      code: createDiscountDto.code,
    });
    if (existing) {
      throw new BadRequestException('Mã giảm giá đã tồn tại');
    }

    const newDiscount = new this.discountModel(createDiscountDto);
    return newDiscount.save();
  }

  async findAll(): Promise<Discount[]> {
    return this.discountModel.find().exec();
  }

  async findByProperty(propertyId: string): Promise<Discount[]> {
    return this.discountModel.find({ propertyId }).exec();
  }

  async findOne(code: string): Promise<Discount> {
    const discount = await this.discountModel
      .findOne({ code })
      .populate('propertyId')
      .exec();
    if (!discount) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }
    return discount;
  }
  async updateIsActive(code: string, isActive: boolean): Promise<Discount> {
    const updated = await this.discountModel.findOneAndUpdate(
      { code },
      { isActive },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }

    return updated;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredDiscounts() {
    const now = new Date();
    const result = await this.discountModel.deleteMany({
      validUntil: { $lt: now },
    });

    if (result.deletedCount > 0) {
      console.log(
        `[DiscountService] Đã xóa ${result.deletedCount} mã giảm giá hết hạn`,
      );
    }
  }
}
