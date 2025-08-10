import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Liked, LikedDocument } from './schemas/liked.schema';
import { CreateLikedDto } from './dto/create-liked.dto';

@Injectable()
export class LikedService {
  constructor(
    @InjectModel(Liked.name) private likedModel: Model<LikedDocument>,
  ) {}

  async addToLiked(createLikedDto: CreateLikedDto): Promise<Liked> {
    const { user, property } = createLikedDto;

    const existingLike = await this.likedModel.findOne({ user });

    if (existingLike) {
      if (existingLike.properties.includes(property.toString())) {
        throw new BadRequestException('Bạn đã lưu chỗ nghỉ này rồi');
      }

      existingLike.properties.push(property.toString());
      return existingLike.save();
    }

    return this.likedModel.create({ user, properties: [property] });
  }

  async removeFromLiked(userId: string, propertyId: string): Promise<void> {
    const updated = await this.likedModel.findOneAndUpdate(
      { user: userId },
      { $pull: { properties: propertyId } }, // gỡ propertyId ra khỏi mảng
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Property not found in your liked list');
    }
  }

  async getLikedProperties(userId: string) {
    const likedList = await this.likedModel
      .find({ user: userId })
      .populate('properties');

    return likedList.flatMap((item) => item.properties);
  }
}
