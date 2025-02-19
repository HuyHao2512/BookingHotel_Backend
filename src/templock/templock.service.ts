import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TempLock, TempLockDocument } from './schemas/templock.schema';
import { Model } from 'mongoose';

@Injectable()
export class TemplockService {
  constructor(
    @InjectModel(TempLock.name) private tempLockModel: Model<TempLockDocument>,
  ) {}

  // 🏷 Lock phòng trong 15 phút (hoặc thời gian tùy chỉnh)
  async lockRoom(roomId: string, userId: string, durationMinutes = 15) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    return this.tempLockModel.create({ room: roomId, user: userId, expiresAt });
  }

  // 🔍 Kiểm tra phòng có bị lock không
  async isRoomLocked(roomId: string): Promise<boolean> {
    const lock = await this.tempLockModel.findOne({ room: roomId });
    return !!lock;
  }

  //Xóa lock khi khách hoàn tất thanh toán
  async releaseLock(roomId: string) {
    return this.tempLockModel.deleteOne({ room: roomId });
  }
}
