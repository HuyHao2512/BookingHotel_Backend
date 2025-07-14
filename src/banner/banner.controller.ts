import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from 'src/auth/enum';
import { Public } from 'src/decorator/customize';

@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async createBanner(
    @Body() createBannerDto: CreateBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bannerService.createBanner(createBannerDto, file);
  }

  @Put(':id')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async updateBanner(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bannerService.updateBanner(id, updateBannerDto, file);
  }

  @Get()
  @Public()
  async findAll() {
    return this.bannerService.findAll();
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string) {
    return this.bannerService.removeBanner(id);
  }
}
