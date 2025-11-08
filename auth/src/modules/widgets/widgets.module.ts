import { Module } from '@nestjs/common';
import { WidgetsService } from './widgets.service';
import { WidgetsController } from './widgets.controller';

@Module({
  providers: [WidgetsService],
  controllers: [WidgetsController],
  exports: [WidgetsService],
})
export class WidgetsModule {}
