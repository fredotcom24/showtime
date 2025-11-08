import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly calendarApiUrl = 'https://www.googleapis.com/calendar/v3';
  private readonly googleOAuthUrl = 'https://oauth2.googleapis.com/token';

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  private async findServiceId(): Promise<string> {
    const svc = await this.prisma['service'].findUnique({
      where: { name: 'calendar' },
    });
    if (!svc) {
      throw new InternalServerErrorException(
        'Service "calendar" not found in DB. Create it first.',
      );
    }
    return svc.id;
  }

  private async getAccessToken(userId: string): Promise<string> {
    const serviceId = await this.findServiceId();

    const userService = await (this.prisma as any).userService.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });

    if (
      !userService ||
      (!userService.accessToken && !userService.refreshToken)
    ) {
      throw new ForbiddenException(
        'Google Calendar not connected for this user. Please connect your Google account.',
      );
    }

    // Vérifier si le token a expiré
    const now = new Date();
    if (userService.tokenExpiry && userService.tokenExpiry < now) {
      // Rafraîchir le token
      if (!userService.refreshToken) {
        throw new UnauthorizedException(
          'Refresh token missing. Please re-authenticate.',
        );
      }

      try {
        const response = await firstValueFrom(
          this.httpService.post(this.googleOAuthUrl, {
            client_id: this.config.get<string>('GOOGLE_CLIENT_ID'),
            client_secret: this.config.get<string>('GOOGLE_CLIENT_SECRET'),
            refresh_token: userService.refreshToken,
            grant_type: 'refresh_token',
          }),
        );

        const { access_token, expires_in } = response.data;

        // Mettre à jour les tokens
        await this.prisma['userService'].update({
          where: { userId_serviceId: { userId, serviceId } },
          data: {
            accessToken: access_token,
            tokenExpiry: new Date(Date.now() + expires_in * 1000),
          },
        });

        return access_token;
      } catch (error) {
        this.logger.error(
          `Failed to refresh token: ${error?.message || error}`,
        );
        throw new UnauthorizedException(
          'Failed to refresh token. Please re-authenticate.',
        );
      }
    }

    return userService.accessToken;
  }

  async getUpcomingEvents(userId: string, maxResults = 10) {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.calendarApiUrl}/calendars/primary/events`,
          {
            params: {
              timeMin: new Date().toISOString(),
              maxResults,
              singleEvents: true,
              orderBy: 'startTime',
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return response.data.items ?? [];
    } catch (err: any) {
      this.logger.error(
        `Error fetching upcoming events: ${err?.message || err}`,
      );
      throw new InternalServerErrorException(
        'Failed to fetch upcoming events from Google Calendar.',
      );
    }
  }

  async getTodayEvents(userId: string) {
    const accessToken = await this.getAccessToken(userId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.calendarApiUrl}/calendars/primary/events`,
          {
            params: {
              timeMin: startOfDay.toISOString(),
              timeMax: endOfDay.toISOString(),
              singleEvents: true,
              orderBy: 'startTime',
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return response.data.items ?? [];
    } catch (err: any) {
      this.logger.error(`Error fetching today events: ${err?.message || err}`);
      throw new InternalServerErrorException(
        'Failed to fetch today events from Google Calendar.',
      );
    }
  }

  async getBirthdays(userId: string, daysRange = 7) {
    const accessToken = await this.getAccessToken(userId);

    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + daysRange);

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.calendarApiUrl}/calendars/primary/events`,
          {
            params: {
              timeMin: now.toISOString(),
              timeMax: end.toISOString(),
              singleEvents: true,
              orderBy: 'startTime',
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      const items = response.data.items ?? [];

      const birthdays = items.filter((ev: any) => {
        const summary: string = (ev.summary ?? '').toLowerCase();
        const description: string = (ev.description ?? '').toLowerCase();
        return (
          summary.includes('birthday') ||
          summary.includes('anniv') ||
          description.includes('birthday')
        );
      });

      return birthdays;
    } catch (err: any) {
      this.logger.error(`Error fetching birthdays: ${err?.message || err}`);
      throw new InternalServerErrorException(
        'Failed to fetch birthday-like events.',
      );
    }
  }
}
