import {
  IsDate,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from 'src/utils/global';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthday?: Date;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  socialId?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  license?: string;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  specialization?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}
