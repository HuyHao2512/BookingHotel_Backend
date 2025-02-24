import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type LikedDocument = Liked & Document;

@Schema()
export class Liked extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }] })
  properties: string[];
}

export const LikedSchema = SchemaFactory.createForClass(Liked);
