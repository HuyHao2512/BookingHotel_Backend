import { Controller, Post, Body } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';

@Controller('refresh-token')
export class RefreshTokenController {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Post()
  async create(
    @Body() body: { userId: string; token: string; expiresAt: Date },
  ) {
    const { userId, token, expiresAt } = body;
    return this.refreshTokenService.create(userId, token, new Date(expiresAt));
  }
}
