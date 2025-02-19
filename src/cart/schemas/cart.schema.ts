import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Room } from '../../room/schemas/room.schema';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Người dùng sở hữu giỏ hàng

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Room' }], default: [] })
  rooms: Types.ObjectId[]; // Danh sách phòng trong giỏ hàng
}

export const CartSchema = SchemaFactory.createForClass(Cart);
