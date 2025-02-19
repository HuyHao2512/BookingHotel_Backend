import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateBookingDto {
  @IsMongoId()
  property: Types.ObjectId; // Property chứa các phòng

  @IsArray()
  @IsMongoId({ each: true })
  room: Types.ObjectId[]; // Danh sách ID phòng

  @IsMongoId()
  user: Types.ObjectId; // ID người đặt

  @IsDateString()
  checkIn: Date; // Ngày nhận phòng

  @IsDateString()
  checkOut: Date; // Ngày trả phòng

  @IsEnum(['pending', 'confirmed'])
  @IsOptional()
  status?: 'pending' | 'confirmed'; // Trạng thái đặt phòng (mặc định: pending)

  @IsNumber()
  @Min(1)
  guests: number; // Số lượng khách

  @IsNumber()
  @Min(0)
  totalPrice: number; // Giá gốc của đơn đặt phòng

  @IsMongoId()
  @IsOptional()
  discount?: Types.ObjectId; // Mã giảm giá (có thể null)

  @IsNumber()
  @Min(0)
  finalPrice: number; // Giá sau khi áp dụng mã giảm giá

  @IsString()
  paymentMethod: string; // Phương thức thanh toán (VNPAY, Momo, Visa,...)

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean; // Trạng thái thanh toán (mặc định: false)
}
