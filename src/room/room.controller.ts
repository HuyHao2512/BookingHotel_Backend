import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
  Put,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/auth/enum';
import { Public } from 'src/decorator/customize';
import { Room } from './schemas/room.schema';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @Roles(Role.Owner)
  @UseInterceptors(FilesInterceptor('files')) // 'files' là key chứa file trong FormData
  async create(
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.roomService.create(createRoomDto, files);
  }
  @Get()
  @Public()
  findAll() {
    return this.roomService.findAll();
  }

  @Get('/available-property/:propertyId')
  @Public()
  async findAvailableRoomsOfProperty(
    @Param('propertyId') propertyId: string,
    @Query('checkIn') checkIn: Date,
    @Query('checkOut') checkOut: Date,
  ) {
    const availableRooms = await this.roomService.findAvailableRoomsOfProperty(
      propertyId,
      checkIn,
      checkOut,
    );
    return availableRooms;
  }

  @Get('/property/:propertyId')
  @Public()
  async getByProperty(@Param('propertyId') propertyId: string) {
    return this.roomService.findByProperty(propertyId);
  }

  @Get(':id')
  @Public()
  findById(@Param('id') id: string) {
    return this.roomService.findById(id);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  delete(@Param('id') id: string) {
    return this.roomService.delete(id);
  }
  @Put(':id')
  @Roles(Role.Owner)
  @UseInterceptors(FilesInterceptor('files', 10))
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: any,
    @UploadedFiles() files?: Express.Multer.File[],
    @Body('removeImageIds') removeImageIds?: string[],
  ) {
    if (!files) {
      console.log('No files received');
    } else {
      console.log('Files received:', files.length, files);
    }
    return this.roomService.update(id, updateRoomDto, files, removeImageIds);
  }
}
