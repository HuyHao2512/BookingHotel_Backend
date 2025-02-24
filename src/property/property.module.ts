import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { Property, PropertySchema } from './schemas/property.schema';
import { CategoryModule } from '../category/category.module';
import { CityModule } from '../city/city.module';
import { AmenityModule } from 'src/amenity/amenity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
    ]),
    CategoryModule,
    CityModule,
    AmenityModule,
  ],
  controllers: [PropertyController],
  providers: [PropertyService],
  exports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
    ]),
  ],
})
export class PropertyModule {}
