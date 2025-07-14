import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { City } from './schemas/city.schema';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CityService {
  constructor(
    @InjectModel(City.name) private cityModel: Model<City>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Tạo thành phố mới
  async createCity(createCityDto: CreateCityDto, file: Express.Multer.File) {
    const { name } = createCityDto;

    const existingCity = await this.cityModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existingCity) {
      throw new BadRequestException(`Thành phố ${name} đã tồn tại.`);
    }

    let image;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'cities',
      );
      image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    }

    const newCity = new this.cityModel({ ...createCityDto, image });
    return newCity.save();
  }

  async updateCity(
    id: string,
    updateCityDto: UpdateCityDto,
    file?: Express.Multer.File,
  ) {
    const city = await this.cityModel.findById(id);
    if (!city) {
      throw new Error('City not found');
    }

    if (file) {
      if (city.image?.publicId) {
        await this.cloudinaryService.deleteImage(city.image.publicId);
      }
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'cities',
      );
      city.image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    }

    Object.assign(city, updateCityDto);
    return city.save();
  }

  async findAll() {
    return this.cityModel.find().exec();
  }

  async findOne(id: string) {
    return this.cityModel.findById(id).exec();
  }

  async removeCity(id: string) {
    const city = await this.cityModel.findById(id);
    if (!city) {
      throw new Error('City not found');
    }

    if (city.image?.publicId) {
      await this.cloudinaryService.deleteImage(city.image.publicId);
    }

    return this.cityModel.findByIdAndDelete(id).exec();
  }

  async findByName(name: string) {
    return this.cityModel
      .find({ name: { $regex: name, $options: 'i' } })
      .exec();
  }

  async countCities() {
    return this.cityModel.countDocuments().exec();
  }

  async getCityOfCountry(name: string) {
    return this.cityModel.find({ country: name }).exec();
  }
}
