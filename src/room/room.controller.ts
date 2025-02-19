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
import { FilesInterceptor } from '@nestjs/platform-express';
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

  @Post('available')
  @Public()
  async findAvailableRooms(
    @Body() body: { startDate: string; endDate: string; city: string },
  ) {
    const { startDate, endDate, city } = body;

    // Chuyển đổi startDate và endDate từ chuỗi thành đối tượng Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Kiểm tra nếu dữ liệu đầu vào là hợp lệ
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }

    return await this.roomService.findAvailableRooms(startDate, endDate, city);
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
  update(@Param('id') id: string, @Body() updateRoomDto: CreateRoomDto) {
    return this.roomService.update(id, updateRoomDto);
  }
}
