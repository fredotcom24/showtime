import { Controller, Get, Req, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @UseGuards(AuthGuard)
  @Get('upcoming')
  async upcoming(@Req() req, @Query('max') max: string) {
    const userId = req.user?.id || req.user?.userId;
    const maxResults = max ? parseInt(max, 10) : 10;
    return this.calendarService.getUpcomingEvents(userId, maxResults);
  }

  @UseGuards(AuthGuard)
  @Get('today')
  async today(@Req() req) {
    const userId = req.user?.id || req.user?.userId;
    return this.calendarService.getTodayEvents(userId);
  }

  @UseGuards(AuthGuard)
  @Get('birthdays')
  async birthdays(@Req() req, @Query('days') days: string) {
    const userId = req.user?.id || req.user?.userId;
    const daysRange = days ? parseInt(days, 10) : 7;
    return this.calendarService.getBirthdays(userId, daysRange);
  }
}
