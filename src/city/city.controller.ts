import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Delete,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CityService } from './city.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from 'src/auth/enum';
import { Roles } from 'src/decorator/roles.decorator';
import { Public } from 'src/decorator/customize';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post('create')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async createCity(
    @Body() createCityDto: CreateCityDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.cityService.createCity(createCityDto, file);
  }

  @Get()
  @Public()
  async findAll() {
    return this.cityService.findAll();
  }

  @Get('search')
  async findByName(@Query('name') name: string) {
    return this.cityService.findByName(name);
  }

  @Get('count')
  async countCities() {
    return this.cityService.countCities();
  }
  @Get('country')
  @Public()
  async getCityOfCountry(@Query('name') name: string) {
    return this.cityService.getCityOfCountry(name);
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.cityService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateCity(
    @Param('id') id: string,
    @Body() updateCityDto: UpdateCityDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.cityService.updateCity(id, updateCityDto, file);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async removeCity(@Param('id') id: string) {
    return this.cityService.removeCity(id);
  }
}
