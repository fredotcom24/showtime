import { Controller, Get, Param } from '@nestjs/common';
import { WidgetsService } from './widgets.service';

@Controller('widgets')
export class WidgetsController {
  constructor(private widgetsService: WidgetsService) {}

  @Get()
  async getAllWidgets() {
    return this.widgetsService.findAll();
  }

  @Get('service/:serviceId')
  async getWidgetsByService(@Param('serviceId') serviceId: string) {
    return this.widgetsService.findByService(serviceId);
  }

  @Get(':id')
  async getWidget(@Param('id') id: string) {
    return this.widgetsService.findOne(id);
  }
}
