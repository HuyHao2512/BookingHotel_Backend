import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { CreateCartDto } from './dto/create-cart.dto';

@Injectable()
export class CartService {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

  async getCart(userId: string): Promise<Cart> {
    return this.cartModel.findOne({ userId }).populate('rooms').exec();
  }

  async addToCart(userId: string, addToCartDto: CreateCartDto): Promise<Cart> {
    const { roomId } = addToCartDto;
    let cart = await this.cartModel.findOne({ userId });

    if (!cart) {
      cart = new this.cartModel({ userId, rooms: [] });
    }

    const roomObjectId = new Types.ObjectId(roomId); // ✅ Chuyển đổi string thành ObjectId

    if (!cart.rooms.includes(roomObjectId)) {
      cart.rooms.push(roomObjectId);
    }

    return cart.save();
  }

  async removeFromCart(userId: string, roomId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId });

    if (!cart) throw new NotFoundException('Giỏ hàng không tồn tại');

    const roomObjectId = new Types.ObjectId(roomId); // ✅ Chuyển đổi string thành ObjectId

    cart.rooms = cart.rooms.filter((room) => !room.equals(roomObjectId));
    return cart.save();
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartModel.deleteOne({ userId });
  }
}
