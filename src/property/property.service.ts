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

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    files?: Express.Multer.File[],
    removeImageIds?: string[],
  ) {
    try {
      const existingProperty = await this.propertyModel.findById(id);
      if (!existingProperty) {
        throw new NotFoundException('Room not found');
      }
      const { ...updatedData } = updatePropertyDto;
      let images = existingProperty.images || [];

      if (removeImageIds?.length > 0) {
        for (const publicId of removeImageIds) {
          await this.cloudinaryService.deleteImage(publicId);
        }
        images = images.filter((img) => !removeImageIds.includes(img.publicId));
      }

      if (files && files.length > 0) {
        try {
          const newImages = await Promise.all(
            files.map(async (file) => {
              const uploadResult = await this.cloudinaryService.uploadImage(
                file,
                'properties',
              );
              return {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
              };
            }),
          );
          images = [...images, ...newImages];
        } catch (uploadError) {
          throw new BadRequestException(
            `Image upload failed: ${uploadError.message}`,
          );
        }
      }
      let amenities: Types.ObjectId[] = [];
      if (updatePropertyDto.amenities) {
        if (typeof updatePropertyDto.amenities === 'string') {
          try {
            const parsedConveniences = JSON.parse(updatePropertyDto.amenities);
            if (Array.isArray(parsedConveniences)) {
              amenities = parsedConveniences
                .map((id) => id.trim())
                .filter((id) => Types.ObjectId.isValid(id))
                .map((id) => new Types.ObjectId(id));
            }
          } catch (error) {
            throw new BadRequestException('Invalid amenities format');
          }
        } else if (Array.isArray(updatePropertyDto.amenities)) {
          amenities = updatePropertyDto.amenities
            .filter((id) => Types.ObjectId.isValid(id))
            .map((id) => new Types.ObjectId(id));
        }
      }
      const updatedProperty = await this.propertyModel.findByIdAndUpdate(
        id,
        {
          ...updatedData,
          amenities,
          images,
        },
        { new: true, runValidators: true },
      );
      return updatedProperty;
    } catch (error) {
      throw new BadRequestException(
        `Error updating property: ${error.message}`,
      );
    }
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
      if (minRate >= 1 && minRate < 5) {
        filter.rate = { $gte: minRate, $lt: minRate + 1 };
      } else if (minRate === 5) {
        filter.rate = 5; // hoặc { $eq: 5 } nếu bạn thích rõ ràng hơn
      } else {
        filter.rate = { $gte: minRate };
      }
    }

    const results = await this.propertyModel
      .find(filter)
      .populate('category')
      .populate('city')
      .exec();
    return results;
  }
}
