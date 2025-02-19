import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken } from './schemas/refresh-token.schemas';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
  ) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return this.refreshTokenModel.create({ userId, token, expiresAt });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenModel.findOne({ token });
  }

  async deleteByToken(token: string): Promise<void> {
    await this.refreshTokenModel.deleteOne({ token });
  }

  async deleteByUser(userId: string): Promise<void> {
    await this.refreshTokenModel.deleteMany({ userId });
  }
}
