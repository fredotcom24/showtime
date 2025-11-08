import { Module } from '@nestjs/common';
import { WidgetInstancesController } from './widget-instances.controller';
import { WidgetInstancesService } from './widget-instances.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WidgetInstancesController],
  providers: [WidgetInstancesService],
  exports: [WidgetInstancesService],
})
export class WidgetInstancesModule {}
