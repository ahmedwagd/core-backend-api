import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender } from 'src/utils/global';

export class CreateProfileDto {
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  lastName: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  birthday: Date;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  socialId: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  license?: string;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  specialization?: string;

  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsNotEmpty()
  userId: number;
}
