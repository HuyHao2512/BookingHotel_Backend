import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Image } from '../../image/schemas/image.schema';

@Schema()
export class Banner extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Object, required: false })
  image?: Image;

  @Prop({ required: true })
  description: string;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
