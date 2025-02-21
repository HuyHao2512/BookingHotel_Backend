import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikedDocument = Liked & Document;

@Schema({ timestamps: true })
export class Liked {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId; // Người dùng lưu danh sách

  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' })
  property: Types.ObjectId; // Property được yêu thích
}

export const LikedSchema = SchemaFactory.createForClass(Liked);
