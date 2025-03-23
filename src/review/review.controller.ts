import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Public } from 'src/decorator/customize';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // 📌 API: Tạo review mới
  @Post()
  @Public()
  async create(@Body() createReviewDto: CreateReviewDto) {
    return await this.reviewService.create(createReviewDto);
  }

  // 📌 API: Lấy tất cả review của một property
  @Get('property/:propertyId')
  @Public()
  async findByProperty(@Param('propertyId') propertyId: string) {
    const reviews = await this.reviewService.findByProperty(propertyId);
    return reviews ?? []; // Luôn trả về mảng rỗng
  }

  // 📌 API: Cập nhật review
  @Put(':id')
  @Public()
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return await this.reviewService.update(id, updateReviewDto);
  }

  // 📌 API: Xóa review
  @Delete(':id')
  @Public()
  async remove(@Param('id') id: string) {
    return await this.reviewService.remove(id);
  }
}
