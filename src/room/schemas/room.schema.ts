import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Image } from 'src/image/schemas/image.schema';

export type RoomDocument = HydratedDocument<Room>;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true })
  name: string; // Tên phòng

  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' })
  property: Types.ObjectId; // Thuộc Property nào (quan hệ)

  @Prop({ required: true, type: Types.ObjectId, ref: 'RoomType' })
  roomType: Types.ObjectId; // Loại phòng (RoomType)

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Convenience' }] })
  conveniences: Types.ObjectId[]; // Danh sách tiện nghi (Convenience)

  @Prop({ required: true })
  price: number; // Giá phòng

  @Prop()
  area: number; // Diện tích phòng

  @Prop()
  capacity: number; // Số người tối đa

  @Prop()
  bed: number; // Số giường

  @Prop()
  direction: string; // Hướng phòng

  @Prop({ default: true })
  isAvailable: boolean; // Phòng có sẵn hay không

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Image' }], default: [] })
  images: Image[]; // Hình ảnh của phòng

  @Prop({ required: true, default: 1 }) // 🏨 Số lượng phòng có sẵn
  quantity: number;

  @Prop({ default: false }) // 🏷 Nếu quantity = 1 thì phòng bị khóa
  isLocked: boolean;

  @Prop({ required: true })
  totalRoom: number; // 🏨 Tổng số lượng phòng
}

export const RoomSchema = SchemaFactory.createForClass(Room);
