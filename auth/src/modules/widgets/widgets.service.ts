/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class WidgetsService {
  constructor(private prisma: PrismaService) {}

  // get all widgets
  async findAll() {
    return this.prisma.widget.findMany({
      include: {
        service: true,
      },
    });
  }

  // get widgets of a service
  async findByService(serviceId: string) {
    return this.prisma.widget.findMany({
      where: { serviceId },
      include: {
        service: true,
      },
    });
  }

  // Récupérer un widget par ID
  async findOne(id: string) {
    const widget = await this.prisma.widget.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });

    if (!widget) {
      throw new NotFoundException(`Widget with ID ${id} not found`);
    }

    return widget;
  }
}
