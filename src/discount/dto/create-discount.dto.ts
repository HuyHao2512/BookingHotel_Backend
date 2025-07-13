import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsDate()
  expiryDate: Date;

  @IsBoolean()
  isActive?: boolean;

  @IsString()
  propertyId: string; // ID loại phòng áp dụng giảm giá

  @IsString()
  description?: string; // Mô tả giảm giá, có thể để trống
}
