import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { UserServicesService } from './user-services.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GmailOAuthGuard } from '../auth/guards/gmail-oauth.guard';
import { GoogleDriveOAuthGuard } from '../auth/guards/google-drive-oauth.guard';
import { CalendarOAuthGuard } from '../auth/guards/calendar-oauth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('user-services')
export class UserServicesController {
  constructor(
    private userServicesService: UserServicesService,
    private configService: ConfigService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async getUserServices(@CurrentUser() user: any) {
    return this.userServicesService.getUserServices(user.userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async activateService(
    @CurrentUser() user: any,
    @Body() body: { serviceId: string },
  ) {
    return this.userServicesService.activateService(
      user.userId,
      body.serviceId,
    );
  }

  @Delete(':serviceId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deactivateService(
    @CurrentUser() user: any,
    @Param('serviceId') serviceId: string,
  ) {
    return this.userServicesService.deactivateService(user.userId, serviceId);
  }

  @Get('gmail/connect')
  @UseGuards(AuthGuard, GmailOAuthGuard)
  async gmailConnect(@CurrentUser() user: any, @Req() req) {
    // Add userId to request so guard can use it in state
    req.query = { ...req.query, state: user.userId };
  }

  @Get('gmail/callback')
  @UseGuards(GmailOAuthGuard)
  async gmailCallback(@Req() req, @Res() res) {
    const { accessToken, refreshToken, userId } = req.user;

    if (!userId) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(`${frontendUrl}?error=missing_user_id`);
    }

    try {
      // Save tokens using the userId from OAuth state
      await this.userServicesService.saveGmailTokens(
        userId,
        accessToken,
        refreshToken,
      );

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(`${frontendUrl}?gmail_connected=true`);
    } catch (error) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(
        `${frontendUrl}?error=token_save_failed&message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Get('google-drive/connect')
  @UseGuards(AuthGuard, GoogleDriveOAuthGuard)
  async googleDriveConnect(@CurrentUser() user: any, @Req() req) {
    // Add userId to request so guard can use it in state
    req.query = { ...req.query, state: user.userId };
  }

  @Get('google-drive/callback')
  @UseGuards(GoogleDriveOAuthGuard)
  async googleDriveCallback(@Req() req, @Res() res) {
    const { accessToken, refreshToken, userId } = req.user;

    if (!userId) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(`${frontendUrl}?error=missing_user_id`);
    }

    try {
      // Save tokens using the userId from OAuth state
      await this.userServicesService.saveGoogleDriveTokens(
        userId,
        accessToken,
        refreshToken,
      );

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(`${frontendUrl}?google_drive_connected=true`);
    } catch (error) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(
        `${frontendUrl}?error=token_save_failed&message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Get('calendar/connect')
  @UseGuards(AuthGuard, CalendarOAuthGuard)
  async calendarConnect(@CurrentUser() user: any, @Req() req) {
    // Add userId to request so guard can use it in state
    req.query = { ...req.query, state: user.userId };
  }

  @Get('calendar/callback')
  @UseGuards(CalendarOAuthGuard)
  async calendarCallback(@Req() req, @Res() res) {
    const { accessToken, refreshToken, userId } = req.user;

    if (!userId) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(`${frontendUrl}?error=missing_user_id`);
    }

    try {
      // Save tokens using the userId from OAuth state
      await this.userServicesService.saveCalendarTokens(
        userId,
        accessToken,
        refreshToken,
      );

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(`${frontendUrl}?calendar_connected=true`);
    } catch (error) {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(
        `${frontendUrl}?error=token_save_failed&message=${encodeURIComponent(error.message)}`,
      );
    }
  }
}
