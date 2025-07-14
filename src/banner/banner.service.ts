import { Injectable } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner } from './schemas/banner.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<Banner>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async createBanner(
    createBannerDto: CreateBannerDto,
    file: Express.Multer.File,
  ) {
    const { title, description } = createBannerDto;

    let image;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'banners',
      );
      image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    }

    const newBanner = new this.bannerModel({
      title,
      description,
      image,
    });

    return newBanner.save();
  }
  async findAll() {
    return this.bannerModel.find().exec();
  }

  async updateBanner(
    id: string,
    updateBannerDto: UpdateBannerDto,
    file?: Express.Multer.File,
  ) {
    const banner = await this.bannerModel.findById(id);
    if (!banner) {
      throw new Error('Banner not found');
    }
    if (file) {
      if (banner.image?.publicId) {
        await this.cloudinaryService.deleteImage(banner.image.publicId);
      }
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'banners',
      );
      banner.image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    }
    Object.assign(banner, updateBannerDto);
    return banner.save();
  }

  async removeBanner(id: string) {
    const banner = await this.bannerModel.findById(id);
    if (!banner) {
      throw new Error('Banner not found');
    }
    if (banner.image?.publicId) {
      await this.cloudinaryService.deleteImage(banner.image.publicId);
    }
    return this.bannerModel.findByIdAndDelete(id).exec();
  }
}
