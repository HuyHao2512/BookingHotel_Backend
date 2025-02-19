import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConvenienceDocument = HydratedDocument<Convenience>;

@Schema()
export class Convenience {
  @Prop({ required: true })
  name: string; // Tên tiện ích (ví dụ: "Wifi", "TV")
}

export const ConvenienceSchema = SchemaFactory.createForClass(Convenience);
