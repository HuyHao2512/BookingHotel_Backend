import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { City } from 'src/city/schemas/city.schema';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectModel(City.name) private cityModel: Model<mongoose.Document>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createPropertyDto: CreatePropertyDto,
    files: Express.Multer.File[],
  ) {
    const images = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'properties',
        );
        images.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      }
    }
    if (typeof createPropertyDto.amenities === 'string') {
      createPropertyDto.amenities = (createPropertyDto.amenities as any)
        .replace(/\[|\]/g, '')
        .split(',')
        .map((amenity) => new Types.ObjectId(amenity));
    }
    const newProperty = new this.propertyModel({
      ...createPropertyDto,
      images,
    });

    return newProperty.save();
  }

  async findAll() {
    const properties = await this.propertyModel
      .aggregate([
        {
          $lookup: {
            from: 'amenities',
            localField: 'amenities',
            foreignField: '_id',
            as: 'amenities',
          },
        },
      ])
      .exec();
    return this.propertyModel.populate(properties, [
      { path: 'category' },
      { path: 'city' },
    ]);
  }

  async findOne(id: string) {
    const properties = await this.propertyModel
      .aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } }, // Tìm theo id
        {
          $lookup: {
            from: 'amenities',
            localField: 'amenities',
            foreignField: '_id',
            as: 'amenities',
          },
        },
      ])
      .exec();

    if (!properties || properties.length === 0) {
      throw new NotFoundException('Property not found');
    }

    return this.propertyModel.populate(properties[0], [
      { path: 'category' },
      { path: 'city' },
    ]);
  }

  async findByOwner(owner: string) {
    return this.propertyModel
      .find({ owner })
      .populate('category')
      .populate('city')
      .exec();
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    const updatedProperty = await this.propertyModel
      .findByIdAndUpdate(id, updatePropertyDto, { new: true })
      .exec();
    if (!updatedProperty) {
      throw new NotFoundException('Property not found');
    }
    return updatedProperty;
  }

  async remove(id: string) {
    const deletedProperty = await this.propertyModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedProperty) {
      throw new NotFoundException('Property not found');
    }
    return deletedProperty;
  }

  async findByCity(cityId: string) {
    const properties = await this.propertyModel
      .find({ city: cityId })
      .populate('category')
      .populate('city')
      .exec();

    if (!properties.length) {
      throw new NotFoundException('No properties found for this city');
    }

    return properties;
  }

  async findByCategory(categoryId: string) {
    const properties = await this.propertyModel
      .find({ category: categoryId })
      .populate('category')
      .populate('city')
      .exec();
    return properties;
  }

  async filterByAmenities(amenities: string[]): Promise<Property[]> {
    const validAmenities = amenities.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validAmenities.length !== amenities.length) {
      throw new BadRequestException('One or more amenity IDs are invalid');
    }

    const amenitiesObjectIds = validAmenities.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    return await this.propertyModel.find({
      amenities: { $all: amenitiesObjectIds },
    });
  }
  async filterProperties(
    cityName?: string,
    cityId?: string,
    categoryId?: string,
    amenities?: string[],
    minRate?: number,
  ) {
    const filter: any = {};

    if (cityName) {
      const city = await this.cityModel.findOne({ name: cityName }).exec();
      if (city) {
        filter.city = city._id.toString();
      } else {
        return [];
      }
    } else if (cityId) {
      filter.city = cityId;
    }

    if (categoryId) {
      filter.category = categoryId;
    }
    if (amenities && amenities.length > 0) {
      filter.amenities = {
        $all: amenities.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (minRate) {
      filter.rate = { $gte: minRate };
    }

    const results = await this.propertyModel
      .find(filter)
      .populate('category')
      .populate('city')
      .exec();
    return results;
  }
}
