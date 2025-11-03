import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsOptional,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToArray } from './to-array.decorator';

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

export class CreateConcertDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  groupIds?: string[];

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEnum(ConcertGenre)
  @IsNotEmpty()
  genre: ConcertGenre;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalTickets: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
