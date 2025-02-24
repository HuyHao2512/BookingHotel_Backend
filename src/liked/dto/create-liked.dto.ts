import { IsMongoId } from 'class-validator';

export class CreateLikedDto {
  @IsMongoId()
  user: string; // ID người dùng

  @IsMongoId()
  property: string[]; // ID property
}
