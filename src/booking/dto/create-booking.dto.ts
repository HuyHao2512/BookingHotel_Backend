import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
class RoomBookingDto {
  @IsMongoId()
  room: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
export class CreateBookingDto {
  @IsMongoId()
  property: Types.ObjectId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomBookingDto)
  rooms: RoomBookingDto[];

  @IsMongoId()
  user: Types.ObjectId;

  @IsDateString()
  checkIn: Date;

  @IsDateString()
  checkOut: Date;

  @IsEnum(['pending', 'confirmed'])
  @IsOptional()
  status?: 'pending' | 'confirmed';

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsMongoId()
  @IsOptional()
  discount?: Types.ObjectId;

  @IsNumber()
  @Min(0)
  finalPrice: number;

  @IsString()
  paymentMethod: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsString()
  @IsEmail()
  email: string;
}
