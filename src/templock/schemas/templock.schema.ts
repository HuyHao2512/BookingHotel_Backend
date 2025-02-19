import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TempLockDocument = HydratedDocument<TempLock>;

@Schema({ timestamps: true })
export class TempLock {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Room' })
  room: Types.ObjectId; // ID phòng bị khóa

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId; // ID người đặt

  @Prop({ required: true, default: Date.now })
  lockedAt: Date; // Thời điểm bắt đầu khóa

  @Prop({ required: true })
  expiresAt: Date; // Thời điểm hết hạn khóa
}

export const TempLockSchema = SchemaFactory.createForClass(TempLock);

// Tạo TTL Index để tự động xóa lock khi hết hạn
TempLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
