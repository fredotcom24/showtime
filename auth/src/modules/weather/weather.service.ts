import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  description: string;
  windSpeed: number;
  clouds: number;
  units: string;
}

export interface ForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

@Injectable()
export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('OPENWEATHER_API_KEY')!;
    this.baseUrl = this.configService.get<string>('OPENWEATHER_BASE_URL')!;
  }

  // get current weather
  async getCurrentWeather(
    city: string,
    units: string = 'metric',
  ): Promise<WeatherData> {
    try {
      const url = `${this.baseUrl}/weather`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            q: city,
            units,
            appid: this.apiKey,
          },
        }),
      );

      const data = response.data;

      return {
        city: data.name,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        windSpeed: data.wind.speed,
        clouds: data.clouds.all,
        units: units === 'metric' ? '°C' : '°F',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch weather for ${city}: ${error.message}`,
      );
    }
  }

  // get weather forecast
  async getForecast(
    city: string,
    days: number = 5,
    units: string = 'metric',
  ): Promise<ForecastDay[]> {
    try {
      const url = `${this.baseUrl}/forecast`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            q: city,
            units,
            appid: this.apiKey,
            cnt: days * 8,
          },
        }),
      );

      const data = response.data;

      // group by day
      const dailyData: { [key: string]: any[] } = {};

      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = [];
        }
        dailyData[date].push(item);
      });

      // get daily forecast
      const forecast: ForecastDay[] = Object.entries(dailyData)
        .slice(0, days)
        .map(([date, items]) => {
          const temps = items.map((item) => item.main.temp);
          const descriptions = items.map((item) => item.weather[0].description);

          return {
            date,
            tempMin: Math.round(Math.min(...temps)),
            tempMax: Math.round(Math.max(...temps)),
            description: descriptions[0],
            humidity: Math.round(
              items.reduce((sum, item) => sum + item.main.humidity, 0) /
                items.length,
            ),
            windSpeed: items[0].wind.speed,
          };
        });

      return forecast;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch forecast for ${city}: ${error.message}`,
      );
    }
  }
}
