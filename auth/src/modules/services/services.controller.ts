import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('services')
export class ServicesController {
  constructor(private serviceService: ServicesService) {}

  @Get()
  async getAllServices() {
    return this.serviceService.findAll();
  }

  @Get('public')
  async getPublicServices() {
    return this.serviceService.findPublicServices();
  }

  @Get('my-services')
  @UseGuards(AuthGuard)
  async getServices(@CurrentUser() user: any) {
    return this.serviceService.findUserServices(user.userId);
  }

  @Get(':id')
  async getService(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }
}
