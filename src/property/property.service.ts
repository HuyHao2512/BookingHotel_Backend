import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
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

    const newProperty = new this.propertyModel({
      ...createPropertyDto,
      images,
    });

    return newProperty.save();
  }

  async findAll() {
    return this.propertyModel
      .find()
      .populate('category')
      .populate('city')
      .exec();
  }

  async findOne(id: string) {
    const property = await this.propertyModel
      .findById(id)
      .populate('category')
      .populate('city')
      .exec();
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
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
}
