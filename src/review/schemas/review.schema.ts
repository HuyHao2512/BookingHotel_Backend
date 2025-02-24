import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true }) // Tự động thêm createdAt, updatedAt
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  property: string;

  @Prop({ type: Number, required: true, min: 1, max: 5 }) // Rating từ 1 đến 5
  rating: number;

  @Prop({ type: String, required: false }) // Nội dung review không bắt buộc
  comment?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
