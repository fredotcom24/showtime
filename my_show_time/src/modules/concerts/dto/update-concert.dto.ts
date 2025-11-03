import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

enum ConcertGenre {
  ROCK = 'ROCK',
  POP = 'POP',
  JAZZ = 'JAZZ',
  ELECTRONIC = 'ELECTRONIC',
  HIP_HOP = 'HIP_HOP',
  CLASSICAL = 'CLASSICAL',
  METAL = 'METAL',
  INDIE = 'INDIE',
  OTHER = 'OTHER',
}

export class UpdateConcertDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(ConcertGenre)
  @IsOptional()
  genre?: ConcertGenre;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date?: Date;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  groupIds?: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
