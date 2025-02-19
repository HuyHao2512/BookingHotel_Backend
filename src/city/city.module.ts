import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { City, CitySchema } from './schemas/city.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { BookingService } from 'src/booking/booking.service';
import { BookingModule } from 'src/booking/booking.module';
import { PropertyModule } from 'src/property/property.module';
import { DiscountModule } from 'src/discount/discount.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: City.name, schema: CitySchema }]), // Đăng ký CityModel
  ],
  controllers: [CityController],
  providers: [CityService, CloudinaryService], // Đảm bảo CloudinaryService được thêm ở đây
})
export class CityModule {}
