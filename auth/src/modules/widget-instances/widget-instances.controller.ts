import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WidgetInstancesService } from './widget-instances.service';
import { CreateWidgetInstanceDto } from './dto/create-widget-instance.dto';
import { UpdateWidgetInstanceDto } from './dto/update-widget-instance.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('widget-instances')
@UseGuards(AuthGuard)
export class WidgetInstancesController {
  constructor(private widgetInstancesService: WidgetInstancesService) {}

  // Get all widget instances for the current user
  @Get()
  async getUserWidgetInstances(@CurrentUser() user: any) {
    return this.widgetInstancesService.getUserWidgetInstances(user.userId);
  }

  // Get a single widget instance
  @Get(':id')
  async getWidgetInstance(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.widgetInstancesService.getWidgetInstance(user.userId, id);
  }

  // Create a new widget instance
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWidgetInstance(
    @CurrentUser() user: any,
    @Body() dto: CreateWidgetInstanceDto,
  ) {
    return this.widgetInstancesService.createWidgetInstance(user.userId, dto);
  }

  // Update a widget instance
  @Put(':id')
  async updateWidgetInstance(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateWidgetInstanceDto,
  ) {
    return this.widgetInstancesService.updateWidgetInstance(
      user.userId,
      id,
      dto,
    );
  }

  // Delete a widget instance
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteWidgetInstance(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.widgetInstancesService.deleteWidgetInstance(user.userId, id);
  }
}
