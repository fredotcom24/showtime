import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Get('current')
  async getCurrentWeather(
    @Query('city') city: string,
    @Query('units') units: string = 'metric',
  ) {
    if (!city) {
      throw new BadRequestException('City name is required');
    }

    return this.weatherService.getCurrentWeather(city, units);
  }

  @Get('forecast')
  async getForecast(
    @Query('city') city: string,
    @Query('days') days: string = '5',
    @Query('units') units: string = 'metric',
  ) {
    if (!city) {
      throw new BadRequestException('City name is required');
    }

    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays < 1 || numDays > 7) {
      throw new BadRequestException('Days must be between 1 and 7');
    }

    return this.weatherService.getForecast(city, numDays, units);
  }
}
