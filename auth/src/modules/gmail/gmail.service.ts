import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  labels: string[];
}

@Injectable()
export class GmailService {
  private readonly gmailApiUrl = 'https://gmail.googleapis.com/gmail/v1';
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
        service: { name: 'email' },
        isActive: true,
      },
    });

    if (!userService || !userService.accessToken) {
      throw new UnauthorizedException(
        'Gmail not connected. Please authenticate with Google.',
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

  private async processBatch<T, R>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }

    return results;
  }

  async getUnreadEmails(
    userId: string,
    maxResults: number = 10,
  ): Promise<EmailMessage[]> {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.gmailApiUrl}/users/me/messages`, {
          params: {
            q: 'is:unread',
            maxResults,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      if (!response.data.messages || response.data.messages.length === 0) {
        return [];
      }

      const emails = await this.fetchEmailDetails(
        accessToken,
        response.data.messages,
      );
      return emails;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch unread emails: ${error.message}`,
      );
    }
  }

  async getImportantEmails(
    userId: string,
    maxResults: number = 10,
  ): Promise<EmailMessage[]> {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.gmailApiUrl}/users/me/messages`, {
          params: {
            q: 'is:important',
            maxResults,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      if (!response.data.messages || response.data.messages.length === 0) {
        return [];
      }

      const emails = await this.fetchEmailDetails(
        accessToken,
        response.data.messages,
      );
      return emails;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch important emails: ${error.message}`,
      );
    }
  }

  async getRecentEmails(
    userId: string,
    maxResults: number = 10,
  ): Promise<EmailMessage[]> {
    const accessToken = await this.getAccessToken(userId);

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.gmailApiUrl}/users/me/messages`, {
          params: {
            maxResults,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      if (!response.data.messages || response.data.messages.length === 0) {
        return [];
      }

      const emails = await this.fetchEmailDetails(
        accessToken,
        response.data.messages,
      );
      return emails;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch recent emails: ${error.message}`,
      );
    }
  }

  private async fetchEmailDetails(
    accessToken: string,
    messages: any[],
  ): Promise<EmailMessage[]> {
    return this.processBatch(messages, 5, async (message) => {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.gmailApiUrl}/users/me/messages/${message.id}`,
            {
              params: {
                format: 'metadata',
                metadataHeaders: ['From', 'Subject', 'Date'],
              },
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          ),
        );

        const msg = response.data;
        const headers = msg.payload?.headers || [];
        const from =
          headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
        const subject =
          headers.find((h: any) => h.name === 'Subject')?.value ||
          '(No subject)';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';

        return {
          id: msg.id,
          threadId: msg.threadId,
          from,
          subject,
          snippet: msg.snippet || '',
          date,
          isUnread: msg.labelIds?.includes('UNREAD') || false,
          labels: msg.labelIds || [],
        };
      } catch (error) {
        return {
          id: message.id,
          threadId: message.threadId || '',
          from: 'Error',
          subject: 'Failed to load',
          snippet: '',
          date: '',
          isUnread: false,
          labels: [],
        };
      }
    });
  }

  async getConnectionStatus(userId: string) {
    const userService = await this.prisma.userService.findFirst({
      where: {
        userId,
        service: { name: 'email' },
      },
      include: {
        service: true,
      },
    });

    if (!userService) {
      return {
        connected: false,
        message: 'Gmail not connected',
      };
    }

    const isExpired =
      userService.tokenExpiry && userService.tokenExpiry < new Date();

    return {
      connected: userService.isActive && !isExpired,
      email: userService.config ? (userService.config as any).email : null,
      expiresAt: userService.tokenExpiry,
      needsReauth: isExpired,
    };
  }
}
