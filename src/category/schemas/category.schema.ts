import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  description?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
