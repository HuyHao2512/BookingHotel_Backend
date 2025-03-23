import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsMongoId,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  user: string;

  @IsMongoId()
  property: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
