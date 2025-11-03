import { IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { ConcertGenre } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name : string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  bio : string;
  
  @IsEnum(ConcertGenre)
  genre: ConcertGenre;

  @IsString()
  @IsOptional()
  image?: string;

}


