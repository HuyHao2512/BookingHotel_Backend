import { Optional } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiscountDocument = Discount & Document;

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true, min: 0 })
  percentage: number; // Phần trăm giảm giá (0 - 100)

  @Optional()
  @Prop({ type: Types.ObjectId, ref: 'Property' })
  propertyId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  expireDate: Date;

  @Optional()
  @Prop({ type: String }) // Thay thế bằng URL mặc định nếu không có
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);
