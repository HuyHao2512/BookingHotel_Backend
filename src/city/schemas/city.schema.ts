import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Image } from '../../image/schemas/image.schema';

@Schema()
export class City extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Object, required: false })
  image?: Image;

  @Prop({ required: true })
  country: string;
}

export const CitySchema = SchemaFactory.createForClass(City);
