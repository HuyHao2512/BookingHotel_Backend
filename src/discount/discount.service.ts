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
import {
  DiscountUsage,
  DiscountUsageDocument,
} from 'src/discount-usage/schemas/discount-usage.schema';

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel(Discount.name) private discountModel: Model<DiscountDocument>,
    @InjectModel(DiscountUsage.name)
    private usageModel: Model<DiscountUsageDocument>,
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

  async getDiscountPublic(): Promise<Discount[]> {
    const now = new Date();
    return this.discountModel
      .find({ isActive: true, expireDate: { $gt: now }, propertyId: null })
      .exec();
  }
  async verifyDiscount(userId: string, code: string) {
    const discount = await this.discountModel.findOne({ code });

    if (!discount) {
      throw new NotFoundException('Mã giảm giá không tồn tại');
    }

    // Kiểm tra người dùng đã sử dụng mã này chưa
    const hasUsed = await this.usageModel.findOne({
      userId,
      discountCode: code,
    });
    if (hasUsed) {
      throw new BadRequestException('Bạn đã sử dụng mã giảm giá này rồi');
    }

    return {
      isValid: true,
      discount,
      message: 'Mã giảm giá có thể sử dụng',
    };
  }

  // Áp dụng mã giảm giá
  async applyDiscount(userId: string, code: string) {
    // Kiểm tra lại trước khi áp dụng
    await this.verifyDiscount(userId, code);

    // Ghi nhận sử dụng mã
    await this.usageModel.create({
      userId,
      discountCode: code,
      usedAt: new Date(),
    });

    return {
      success: true,
      message: 'Áp dụng mã giảm giá thành công',
    };
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
