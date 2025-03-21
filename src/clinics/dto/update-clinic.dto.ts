import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class UpdateClinicDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  manager?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
