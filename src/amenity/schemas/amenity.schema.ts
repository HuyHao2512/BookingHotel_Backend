import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AmenityDocument = HydratedDocument<Amenity>;

@Schema()
export class Amenity {
  @Prop({ required: true })
  name: string; // Tên tiện ích (ví dụ: "Bể bơi", "Phòng gym")
}

export const AmenitySchema = SchemaFactory.createForClass(Amenity);
