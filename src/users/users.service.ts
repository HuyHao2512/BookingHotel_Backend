import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const hashPassword = this.getHashPassword(createUserDto.password);

    const roles =
      createUserDto.roles && createUserDto.roles.length > 0
        ? createUserDto.roles
        : ['user'];

    const user = await this.userModel.create({
      email: createUserDto.email,
      password: hashPassword,
      roles: roles,
    });

    return {
      userId: user._id,
      email: user.email,
      roles: user.roles,
    };
  }

  async createFromGoogle(
    email: string,
    roles: string[] = ['user'],
  ): Promise<any> {
    let user = await this.findByEmail(email);
    if (!user) {
      // Tạo user mới từ Google (không cần password)
      user = await this.userModel.create({
        email: email,
        password: null, // Không có password cho Google
        roles: roles,
      });
    }

    return {
      userId: user._id,
      email: user.email,
      roles: user.roles,
    };
  }

  findAll() {
    return this.userModel.find();
  }

  findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found user';
    }
    return this.userModel.findById(id);
  }

  findByEmail(username: string) {
    return this.userModel.findOne({
      email: username,
    });
  }

  isValidPassword(password: string, hashPassword: string) {
    return compareSync(password, hashPassword);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found user';
    }
    return this.userModel.findByIdAndDelete(id);
  }
}
