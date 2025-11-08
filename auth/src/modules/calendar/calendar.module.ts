import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, ConfigModule, AuthModule, HttpModule],
  providers: [CalendarService],
  controllers: [CalendarController],
})
export class CalendarModule {}
