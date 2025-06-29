import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './passport/jwt.strategy';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    if (!user.password) {
      throw new UnauthorizedException('Tài khoản không có mật khẩu');
    }

    const isPasswordValid = await this.usersService.isValidPassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }

    return user;
  }

  async login(user: JwtPayload) {
    const payload = { email: user.email, _id: user._id, roles: user.roles }; // Thêm roles vào payload
    const refreshToken = await this.refreshTokenService.create(
      user._id,
      this.jwtService.sign({ userId: user._id }, { expiresIn: '7d' }),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken.token,
    };
  }
  async refreshToken(token: string) {
    const storedToken = await this.refreshTokenService.findByToken(token);
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    const newAccessToken = this.jwtService.sign(
      { userId: storedToken.userId },
      { expiresIn: '15m' },
    );

    return { accessToken: newAccessToken };
  }
  async logout(token: string): Promise<{ message: string }> {
    const storedToken = await this.refreshTokenService.findByToken(token);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.refreshTokenService.deleteByToken(token);

    return { message: 'Logout successful, refresh token deleted.' };
  }
  async googleLogin(googleUser: any) {
    if (!googleUser || !googleUser.email) {
      throw new UnauthorizedException('Google login failed');
    }

    const userData = await this.usersService.createFromGoogle(googleUser.email);
    const payload = {
      email: userData.email,
      _id: userData.userId.toString(),
      roles: userData.roles,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        email: userData.email,
        roles: userData.roles,
      },
    };
  }
}
