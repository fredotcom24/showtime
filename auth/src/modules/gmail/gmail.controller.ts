import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { GmailService } from './gmail.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('gmail')
@UseGuards(AuthGuard)
export class GmailController {
  constructor(private gmailService: GmailService) {}

  @Get('status')
  async getStatus(@CurrentUser() user: any) {
    return this.gmailService.getConnectionStatus(user.userId);
  }

  @Get('unread')
  async getUnreadEmails(
    @CurrentUser() user: any,
    @Query('maxResults') maxResults: string = '10',
  ) {
    const max = parseInt(maxResults, 10);
    if (isNaN(max) || max < 1 || max > 50) {
      throw new BadRequestException('maxResults must be between 1 and 50');
    }

    return this.gmailService.getUnreadEmails(user.userId, max);
  }

  @Get('important')
  async getImportantEmails(
    @CurrentUser() user: any,
    @Query('maxResults') maxResults: string = '10',
  ) {
    const max = parseInt(maxResults, 10);
    if (isNaN(max) || max < 1 || max > 50) {
      throw new BadRequestException('maxResults must be between 1 and 50');
    }

    return this.gmailService.getImportantEmails(user.userId, max);
  }

  @Get('recent')
  async getRecentEmails(
    @CurrentUser() user: any,
    @Query('maxResults') maxResults: string = '10',
  ) {
    const max = parseInt(maxResults, 10);
    if (isNaN(max) || max < 1 || max > 50) {
      throw new BadRequestException('maxResults must be between 1 and 50');
    }

    return this.gmailService.getRecentEmails(user.userId, max);
  }
}
