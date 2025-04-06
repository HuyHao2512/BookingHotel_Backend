import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiscountDocument = Discount & Document;

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, unique: true })
  code: string; // Mã giảm giá

  @Prop({ required: true, min: 0 })
  percentage: number; // Phần trăm giảm giá (0 - 100)

  @Prop({ type: Date, required: true })
  expireDate: Date; // Ngày hết hạn

  @Prop({ default: true })
  isActive: boolean; // Trạng thái áp dụng
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);
