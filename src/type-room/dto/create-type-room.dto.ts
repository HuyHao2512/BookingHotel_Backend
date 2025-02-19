import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateTypeRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
