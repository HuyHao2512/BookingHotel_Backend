import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Query,
  Put,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/auth/enum';
import { Public } from 'src/decorator/customize';
import { Types } from 'mongoose';

@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @Public()
  @UseInterceptors(FilesInterceptor('files')) // Đảm bảo key "files" khớp với form-data
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.propertyService.create(createPropertyDto, files);
  }

  @Get()
  @Public()
  findAll() {
    return this.propertyService.findAll();
  }
  @Get('filter')
  @Public()
  async filterProperties(
    @Query('cityName') cityName?: string,
    @Query('cityId') cityId?: string,
    @Query('categoryId') category?: string,
    @Query('amenities') amenities?: string | string[],
    @Query('minRate') minRate?: string,
  ) {
    let amenitiesArray: string[] = [];

    if (amenities) {
      amenitiesArray = Array.isArray(amenities)
        ? amenities
        : amenities.split(',');
    }

    return this.propertyService.filterProperties(
      cityName,
      cityId,
      category,
      amenitiesArray,
      minRate ? Number(minRate) : undefined,
    );
  }

  @Get('owner/:id')
  @Roles(Role.Owner)
  findByOwner(@Param('id') id: string) {
    return this.propertyService.findByOwner(id);
  }
  @Get('/city/:cityId')
  @Public()
  async getByCity(@Param('cityId') cityId: string) {
    return this.propertyService.findByCity(cityId);
  }
  @Get('/category/:categoryId')
  @Public()
  async getByCategory(@Param('categoryId') categoryId: string) {
    return this.propertyService.findByCategory(categoryId);
  }

  @Post('filter-amenities')
  @Public()
  async filterByAmenities(@Body('amenities') amenities: string[]) {
    if (!amenities || !Array.isArray(amenities) || amenities.length === 0) {
      throw new BadRequestException(
        'Amenities array is required and must not be empty',
      );
    }
    return this.propertyService.filterByAmenities(amenities);
  }
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.Owner)
  @UseInterceptors(FilesInterceptor('files', 10))
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: any,
    @UploadedFiles() files?: Express.Multer.File[],
    @Body('removeImageIds') removeImageIds?: string[],
  ) {
    if (!files) {
      console.log('No files received');
    } else {
      console.log('Files received:', files.length, files);
    }

    return this.propertyService.update(
      id,
      updatePropertyDto,
      files,
      removeImageIds,
    );
  }

  @Delete(':id')
  @Roles(Role.Owner)
  remove(@Param('id') id: string) {
    return this.propertyService.remove(id);
  }
}
