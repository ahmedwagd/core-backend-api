import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserType } from 'src/utils/global';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(250)
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 250)
  username: string;

  @IsBoolean()
  isVerified: boolean;

  @IsEnum(UserType)
  userType: string;
}
