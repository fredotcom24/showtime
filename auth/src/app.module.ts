import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from 'prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ServicesModule } from './modules/services/services.module';
import { WidgetsModule } from './modules/widgets/widgets.module';
import { WeatherModule } from './modules/weather/weather.module';
import { UserServicesModule } from './modules/user-services/user-services.module';
import { GmailModule } from './modules/gmail/gmail.module';
import { GoogleDriveModule } from './modules/google-drive/google-drive.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        secure: false,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),
    ServicesModule,
    WidgetsModule,
    WeatherModule,
    UserServicesModule,
    GmailModule,
    GoogleDriveModule,
    CalendarModule,
  ],
})
export class AppModule {}
