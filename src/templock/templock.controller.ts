import { Controller, Post, Param, Delete } from '@nestjs/common';
import { TemplockService } from './templock.service';

@Controller('templock')
export class TemplockController {
  constructor(private readonly templockService: TemplockService) {}

  @Post(':roomId/:userId')
  async lockRoom(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ) {
    return this.templockService.lockRoom(roomId, userId);
  }

  @Delete(':roomId')
  async releaseLock(@Param('roomId') roomId: string) {
    return this.templockService.releaseLock(roomId);
  }
}
