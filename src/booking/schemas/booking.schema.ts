import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;
@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' })
  property: Types.ObjectId;

  @Prop({ required: true })
  propertyName: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Room' })
  rooms: {
    room: Types.ObjectId;
    quantity: number;
    name: string;
    price: number;
  }[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  checkIn: Date;

  @Prop({ required: true })
  checkOut: Date;

  @Prop({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  @Prop({ type: Number, required: true, min: 0 })
  totalPrice: number;

  @Prop({ type: Number, min: 0 })
  discount?: number;

  @Prop({ type: Number, required: true, min: 0 })
  finalPrice: number;

  @Prop({ type: String, required: true })
  paymentMethod: string;

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  phone: string;

  @Prop()
  confirmationToken: string;

  createdAt?: Date; // Add createdAt explicitly for TypeScript type checking
  updatedAt?: Date;
}
export const BookingSchema = SchemaFactory.createForClass(Booking);
