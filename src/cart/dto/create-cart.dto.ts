import { IsMongoId } from 'class-validator';

export class CreateCartDto {
  @IsMongoId()
  roomId: string; // ID của phòng
}
