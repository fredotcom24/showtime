import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GoogleDriveService {
  private readonly driveApiUrl = 'https://www.googleapis.com/drive/v3';
  private readonly googleOAuthUrl = 'https://oauth2.googleapis.com/token';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  private async getAccessToken(userId: string): Promise<string> {
    const userService = await this.prisma.userService.findFirst({
      where: {
        userId,
        service: { name: 'google_drive' },
        isActive: true,
      },
    });

    if (!userService || !userService.accessToken) {
      throw new UnauthorizedException(
        'Google Drive not connected. Please authenticate with Google.',
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
            client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
            client_secret: this.configService.get<string>(
              'GOOGLE_CLIENT_SECRET',
            ),
            refresh_token: userService.refreshToken,
            grant_type: 'refresh_token',
          }),
        );

        const { access_token, expires_in } = response.data;

        // Mettre à jour les tokens
        await this.prisma.userService.update({
          where: { id: userService.id },
          data: {
            accessToken: access_token,
            tokenExpiry: new Date(Date.now() + expires_in * 1000),
          },
        });

        return access_token;
      } catch (error) {
        throw new UnauthorizedException(
          'Failed to refresh token. Please re-authenticate.',
        );
      }
    }

    return userService.accessToken;
  }

  async getRecentFiles(userId: string, pageSize: number = 10) {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.driveApiUrl}/files`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            pageSize: pageSize,
            orderBy: 'modifiedTime desc',
            q: 'trashed=false',
            fields: 'files(id,name,mimeType,modifiedTime,iconLink,webViewLink)',
          },
        }),
      );

      return {
        success: true,
        files: response.data.files || [],
        count: response.data.files?.length || 0,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException(
          'Token Google Drive invalide ou expiré',
        );
      }

      throw new BadRequestException(
        `Failed to fetch recent files: ${error.message}`,
      );
    }
  }

  async getFilesByType(userId: string, mimeType: string) {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.driveApiUrl}/files`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            q: `mimeType='${mimeType}' and trashed=false`,
            pageSize: 20,
            orderBy: 'modifiedTime desc',
            fields: 'files(id,name,mimeType,modifiedTime,iconLink,webViewLink)',
          },
        }),
      );

      return {
        success: true,
        files: response.data.files || [],
        count: response.data.files?.length || 0,
        mimeType: mimeType,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException(
          'Token Google Drive invalide ou expiré',
        );
      }

      throw new BadRequestException(
        `Failed to fetch files by type: ${error.message}`,
      );
    }
  }
}
