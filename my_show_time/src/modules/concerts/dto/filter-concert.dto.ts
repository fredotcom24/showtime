/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ConcertGenre } from '@prisma/client';

export class FilterConcertDto {
  @IsOptional()
  @IsEnum(ConcertGenre)
  @Transform(({ value }) => (value === '' ? undefined : value))
  genre?: ConcertGenre;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  search?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  groupId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  // @Type(() => Date)
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  // @Type(() => Date)
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
