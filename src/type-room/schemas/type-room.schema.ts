import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TypeRoomDocument = TypeRoom & Document;

@Schema({ timestamps: true })
export class TypeRoom {
  @Prop({ required: true, unique: true })
  name: string; // Ví dụ: Standard, Deluxe, Suite

  @Prop({ default: '' })
  description: string; // Mô tả về loại phòng
}

export const TypeRoomSchema = SchemaFactory.createForClass(TypeRoom);
