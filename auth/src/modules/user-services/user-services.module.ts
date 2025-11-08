import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserServicesService } from './user-services.service';
import { UserServicesController } from './user-services.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [AuthModule, ConfigModule, PrismaModule],
  controllers: [UserServicesController],
  providers: [UserServicesService],
  exports: [UserServicesService],
})
export class UserServicesModule {}
