import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Get('recent-files')
  @UseGuards(AuthGuard)
  async getRecentFiles(
    @CurrentUser() user: any,
    @Query('pageSize') pageSize: string = '10',
  ) {
    try {
      const size = parseInt(pageSize, 10);
      return await this.googleDriveService.getRecentFiles(user.userId, size);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Si l'erreur contient "invalide" ou "expiré", retourner 401
      if (error.message.includes('invalide') || error.message.includes('expiré')) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }

      throw new HttpException(
        error.message || 'Erreur lors de la récupération des fichiers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('files-by-type')
  @UseGuards(AuthGuard)
  async getFilesByType(
    @CurrentUser() user: any,
    @Query('mimeType') mimeType: string = 'application/pdf',
  ) {
    try {
      return await this.googleDriveService.getFilesByType(
        user.userId,
        mimeType,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Si l'erreur contient "invalide" ou "expiré", retourner 401
      if (error.message.includes('invalide') || error.message.includes('expiré')) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }

      throw new HttpException(
        error.message || 'Erreur lors de la récupération des fichiers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
