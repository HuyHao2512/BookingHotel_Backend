import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/auth/enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true }) // Tự động thêm createdAt và updatedAt
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop({
    type: [String], // Mảng các chuỗi
    default: ['user'], // Mặc định là ['user']
    enum: Role, // Chỉ chấp nhận các giá trị trong enum Role
  })
  roles: Role[];
}

export const UserSchema = SchemaFactory.createForClass(User);
