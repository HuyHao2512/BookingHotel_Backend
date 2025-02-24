import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;
@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' })
  property: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Room' })
  rooms: { room: Types.ObjectId; quantity: number }[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true })
  checkIn: Date;

  @Prop({ required: true })
  checkOut: Date;

  @Prop({ default: 'pending' })
  status: 'pending' | 'confirmed';

  @Prop({ type: Number, required: true, min: 0 })
  totalPrice: number;

  @Prop({ type: Types.ObjectId, ref: 'Discount', default: null })
  discount?: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  finalPrice: number;

  @Prop({ type: String, required: true })
  paymentMethod: string;

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({ type: String, required: true })
  email: string;

  @Prop()
  confirmationToken: string;
}
export const BookingSchema = SchemaFactory.createForClass(Booking);
