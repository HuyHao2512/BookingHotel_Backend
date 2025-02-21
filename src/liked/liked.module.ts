import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Liked, LikedSchema } from './schemas/liked.schema';
import { LikedService } from './liked.service';
import { LikedController } from './liked.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Liked.name, schema: LikedSchema }]),
  ],
  controllers: [LikedController],
  providers: [LikedService],
})
export class LikedModule {}
