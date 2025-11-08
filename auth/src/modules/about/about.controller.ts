import { Controller, Get, Req } from '@nestjs/common';
import { AboutService } from './about.service';
import type { Request } from 'express';


@Controller()
export class AboutController {
  constructor(private aboutService: AboutService) {}

  @Get('about.json')
  async getAbout(@Req() req: Request) {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    return this.aboutService.getAboutInfo(clientIp);
  }
}
