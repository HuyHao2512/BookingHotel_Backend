import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TypeRoomService } from './type-room.service';
import { CreateTypeRoomDto } from './dto/create-type-room.dto';
import { UpdateTypeRoomDto } from './dto/update-type-room.dto';
import { Role } from 'src/auth/enum';
import { Roles } from 'src/decorator/roles.decorator';
import { Public } from 'src/decorator/customize';

@Controller('type-rooms')
export class TypeRoomController {
  constructor(private readonly typeRoomService: TypeRoomService) {}

  @Post('create')
  @Roles(Role.Admin)
  async create(@Body() createTypeRoomDto: CreateTypeRoomDto) {
    return this.typeRoomService.create(createTypeRoomDto);
  }

  @Get()
  @Public()
  async findAll() {
    return this.typeRoomService.findAll();
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.typeRoomService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id') id: string,
    @Body() updateTypeRoomDto: UpdateTypeRoomDto,
  ) {
    return this.typeRoomService.update(id, updateTypeRoomDto);
  }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return this.typeRoomService.remove(id);
  // }
}
