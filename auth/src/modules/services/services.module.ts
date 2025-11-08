import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
  imports: [AuthModule],
})
export class ServicesModule {}
