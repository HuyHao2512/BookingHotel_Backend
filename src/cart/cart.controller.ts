import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/auth/enum';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @Roles(Role.User)
  async getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post(':userId')
  @Roles(Role.User)
  async addToCart(
    @Param('userId') userId: string,
    @Body() addToCartDto: CreateCartDto,
  ) {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Delete(':userId/:roomId')
  @Roles(Role.User)
  async removeFromCart(
    @Param('userId') userId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.cartService.removeFromCart(userId, roomId);
  }

  @Delete(':userId')
  @Roles(Role.User)
  async clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
