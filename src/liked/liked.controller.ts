import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common';
import { LikedService } from './liked.service';
import { CreateLikedDto } from './dto/create-liked.dto';

@Controller('liked')
export class LikedController {
  constructor(private readonly likedService: LikedService) {}

  @Post()
  async addToLiked(@Body() createLikedDto: CreateLikedDto) {
    return this.likedService.addToLiked(createLikedDto);
  }

  @Delete(':userId/:propertyId')
  async removeFromLiked(
    @Param('userId') userId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.likedService.removeFromLiked(userId, propertyId);
  }

  @Get(':userId')
  async getLikedProperties(@Param('userId') userId: string) {
    return this.likedService.getLikedProperties(userId);
  }
}
