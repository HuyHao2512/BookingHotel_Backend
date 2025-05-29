import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Req,
  Request,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from '../decorator/customize';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto'; // Import DTO nếu cần
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('/register') // Thay đổi endpoint từ 'create' sang 'register' nếu muốn
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Public()
  @Get('/refresh-token')
  async refreshToken(@Req() req) {
    return this.authService.refreshToken(req.cookies.RefreshToken);
  }
  @Public()
  @Post('/logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Public()
  @Get('/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google')) // <--- thêm dòng này!
  async googleCallback(@Req() req, @Res() res) {
    const { access_token, user } = await this.authService.googleLogin(req.user); // <-- dùng req.user

    res.redirect(
      `http://localhost:5173/auth/google/callback?token=${access_token}&user=${encodeURIComponent(JSON.stringify(user))}`,
    );
  }
}
