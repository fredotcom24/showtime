import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  favoriteBands?: string[];

  @IsOptional()
  verified?: boolean;
}