// src/users/dto/create-user-with-profile.dto.ts
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserType } from 'src/utils/global';
import { CreateProfileDto } from 'src/profiles/dto/create-profile.dto';

export class CreateUserWithProfileDto {
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

  @IsObject()
  @IsOptional()
  profile?: Omit<CreateProfileDto, 'userId'>;
}
