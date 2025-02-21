import { Prop } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import {
  IsString,
  IsMongoId,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  IsISO8601,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
class BookedDateDto {
  @IsISO8601() // Đảm bảo giá trị là ngày hợp lệ
  startDate: string;

  @IsISO8601()
  endDate: string;
}
export class CreateRoomDto {
  @IsString()
  name: string;

  @IsMongoId()
  property: Types.ObjectId; // ID của Property mà Room thuộc về

  @IsArray()
  @IsMongoId({ each: true })
  conveniences: Types.ObjectId[]; // Mảng ID của các tiện nghi

  @IsMongoId()
  typeroom: Types.ObjectId; // ID của loại phòng

  @IsNumber()
  price: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean; // Trạng thái phòng (mặc định là true)

  @IsNumber()
  area: number;

  @IsNumber()
  capacity: number;

  @IsNumber()
  bed: number;

  @IsString()
  direction: string;

  @IsNumber()
  quantity: number; // Số lượng phòng

  @IsNumber()
  totalRoom: number; // Tổng số lượng phòng

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[]; // Mảng URL của hình ảnh

  @IsOptional()
  isLocker?: boolean; // Trạng thái khóa phòng
}
