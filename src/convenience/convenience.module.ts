import { Module } from '@nestjs/common';
import { ConvenienceService } from './convenience.service';
import { ConvenienceController } from './convenience.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Convenience, ConvenienceSchema } from './schemas/convenience.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Convenience.name, schema: ConvenienceSchema },
    ]),
  ],
  controllers: [ConvenienceController],
  providers: [ConvenienceService],
})
export class ConvenienceModule {}
