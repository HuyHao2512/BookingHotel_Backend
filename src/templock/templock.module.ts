import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplockService } from './templock.service';
import { TemplockController } from './templock.controller';
import { TempLock, TempLockSchema } from './schemas/templock.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TempLock.name, schema: TempLockSchema },
    ]), // Đảm bảo khai báo model ở đây
  ],
  providers: [TemplockService],
  controllers: [TemplockController],
  exports: [TemplockService], // Xuất service để sử dụng ở module khác
})
export class TemplockModule {}
