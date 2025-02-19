import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ConvenienceService } from './convenience.service';

@Controller('conveniences')
export class ConvenienceController {
  constructor(private readonly convenienceService: ConvenienceService) {}

  @Post()
  create(@Body() createDto: { name: string }) {
    return this.convenienceService.create(createDto);
  }

  @Get()
  findAll() {
    return this.convenienceService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.convenienceService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: { name?: string }) {
    return this.convenienceService.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.convenienceService.delete(id);
  }
}
