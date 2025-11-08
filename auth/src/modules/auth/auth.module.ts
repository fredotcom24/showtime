import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { GmailOAuthStrategy } from './strategies/gmail-oauth.strategy';
import { GmailOAuthGuard } from './guards/gmail-oauth.guard';
import { GoogleDriveOAuthStrategy } from './strategies/google-drive-oauth.strategy';
import { GoogleDriveOAuthGuard } from './guards/google-drive-oauth.guard';
import { CalendarOAuthStrategy } from './strategies/calendar-oauth.strategy';
import { CalendarOAuthGuard } from './guards/calendar-oauth.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    GoogleStrategy,
    GmailOAuthStrategy,
    GmailOAuthGuard,
    GoogleDriveOAuthStrategy,
    GoogleDriveOAuthGuard,
    CalendarOAuthStrategy,
    CalendarOAuthGuard,
  ],
  exports: [AuthService, AuthGuard, GmailOAuthGuard, GoogleDriveOAuthGuard, CalendarOAuthGuard],
})
export class AuthModule {}
