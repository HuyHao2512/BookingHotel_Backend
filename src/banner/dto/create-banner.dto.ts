import { Optional } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import { Image } from 'src/image/schemas/image.schema';

export class CreateBannerDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  image: Image;

  @Optional()
  @IsNotEmpty()
  description: string;
}
