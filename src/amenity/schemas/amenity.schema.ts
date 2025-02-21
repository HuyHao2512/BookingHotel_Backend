import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema()
export class Amenity extends Document {
  @Prop({ required: true })
  name: string; // Tên tiện ích (ví dụ: "Bể bơi", "Phòng gym")
}

export const AmenitySchema = SchemaFactory.createForClass(Amenity);
