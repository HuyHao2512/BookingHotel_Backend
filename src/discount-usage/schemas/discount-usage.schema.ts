import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose'; // ✅ Import Document

@Schema({ timestamps: true })
export class DiscountUsage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  discountCode: string; // Mã giảm giá mà user đã dùng
}

export type DiscountUsageDocument = DiscountUsage & Document;

export const DiscountUsageSchema = SchemaFactory.createForClass(DiscountUsage);
