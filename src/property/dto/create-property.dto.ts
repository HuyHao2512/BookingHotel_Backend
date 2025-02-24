import { Type } from '@nestjs/common';
import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsMongoId()
  category: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  city: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  owner: Types.ObjectId;

  @IsArray()
  @IsMongoId({ each: true })
  amenities: Types.ObjectId[];

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  files?: Express.Multer.File[];
}
