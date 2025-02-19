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
  property: string; // ID của Property mà Room thuộc về

  @IsArray()
  @IsMongoId({ each: true })
  conveniences: string[]; // Mảng ID của các tiện nghi

  @IsNumber()
  price: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean; // Trạng thái phòng (mặc định là true)

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[]; // Mảng URL của hình ảnh
}
