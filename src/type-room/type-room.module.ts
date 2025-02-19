import { Module } from '@nestjs/common';
import { TypeRoomService } from './type-room.service';
import { TypeRoomController } from './type-room.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeRoom, TypeRoomSchema } from './schemas/type-room.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TypeRoom.name, schema: TypeRoomSchema },
    ]),
  ],
  controllers: [TypeRoomController],
  providers: [TypeRoomService],
  exports: [TypeRoomService], // Export nếu cần sử dụng ở module khác
})
export class TypeRoomModule {}
