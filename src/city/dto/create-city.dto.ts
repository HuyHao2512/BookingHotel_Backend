import { IsNotEmpty } from 'class-validator';
import { Image } from 'src/image/schemas/image.schema';

export class CreateCityDto {
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  image: Image;
  @IsNotEmpty()
  country: string;
}
