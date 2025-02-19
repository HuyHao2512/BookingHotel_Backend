import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AmenityService } from './amenity.service';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/auth/enum';
import { Public } from 'src/decorator/customize';

@Controller('amenities')
export class AmenityController {
  constructor(private readonly amenityService: AmenityService) {}

  @Post('create')
  @Roles(Role.Admin)
  create(@Body() createDto: { name: string }) {
    return this.amenityService.create(createDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.amenityService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.amenityService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updateDto: { name?: string }) {
    return this.amenityService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  delete(@Param('id') id: string) {
    return this.amenityService.delete(id);
  }
}
