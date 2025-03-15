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

  // Thêm property vào danh sách yêu thích
  async addToLiked(createLikedDto: CreateLikedDto): Promise<Liked> {
    const { user, property } = createLikedDto;

    // Kiểm tra xem user đã có danh sách yêu thích chưa
    const existingLike = await this.likedModel.findOne({ user });

    if (existingLike) {
      // Kiểm tra xem property đã có trong danh sách yêu thích chưa
      if (existingLike.properties.includes(property.toString())) {
        throw new BadRequestException(
          'This property is already in your liked list',
        );
      }

      // Thêm property vào danh sách đã thích
      existingLike.properties.push(property.toString());
      return existingLike.save();
    }

    // Nếu user chưa có danh sách yêu thích, tạo mới
    return this.likedModel.create({ user, properties: [property] });
  }

  // Xóa property khỏi danh sách yêu thích
  async removeFromLiked(userId: string, propertyId: string): Promise<void> {
    const deleted = await this.likedModel.findOneAndDelete({
      user: userId,
      property: propertyId,
    });
    if (!deleted) {
      throw new NotFoundException('Property not found in your liked list');
    }
  }

  // Lấy danh sách property đã thích của người dùng
  async getLikedProperties(userId: string) {
    return this.likedModel.find({ user: userId });
  }
}
