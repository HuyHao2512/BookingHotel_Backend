import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from 'src/auth/enum';
export class CreateUserDto {
  @IsEmail()
  email: string;
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  roles: Role[];
}
