import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Length,
} from 'class-validator';
import { UserType } from 'src/utils/global';
export class UpdateUserDto {
  @IsEmail()
  @MaxLength(250)
  @IsOptional()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @IsOptional()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 250)
  @IsOptional()
  username: string;

  @IsBoolean()
  @IsOptional()
  isVerified: boolean;

  @IsEnum(UserType)
  @IsOptional()
  userType: string;
}
