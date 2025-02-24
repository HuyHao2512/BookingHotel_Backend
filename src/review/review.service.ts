import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Property } from '../property/schemas/property.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Property.name) private readonly propertyModel: Model<Property>,
  ) {}

  // 📌 Tạo review và cập nhật rate của property
  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const newReview = await this.reviewModel.create(createReviewDto);
    await this.updatePropertyRating(createReviewDto.property);
    return newReview;
  }

  // 📌 Lấy danh sách review theo property
  async findByProperty(propertyId: string): Promise<Review[]> {
    return this.reviewModel.find({ property: propertyId }).exec();
  }

  // 📌 Cập nhật review
  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(id, updateReviewDto, { new: true })
      .exec();
    if (!updatedReview) throw new NotFoundException('Review not found');

    // Cập nhật lại rating của property
    await this.updatePropertyRating(updatedReview.property.toString());

    return updatedReview;
  }

  // 📌 Xóa review
  async remove(id: string): Promise<void> {
    const review = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!review) throw new NotFoundException('Review not found');

    // Cập nhật lại rating của property
    await this.updatePropertyRating(review.property.toString());
  }

  // 📌 Tính trung bình rating và cập nhật vào property
  private async updatePropertyRating(propertyId: string) {
    const reviews = await this.reviewModel.find({ property: propertyId });

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    await this.propertyModel.findByIdAndUpdate(propertyId, { rate: avgRating });
  }
}
