/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ServiceType } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  //get all services
  async findAll() {
    return this.prisma.service.findMany({
      include: {
        widgets: true,
        _count: {
          select: {
            widgets: true,
          },
        },
      },
    });
  }

  // get public services
  async findPublicServices() {
    return this.prisma.service.findMany({
      where: {
        type: ServiceType.PUBLIC,
        requiresAuth: false,
      },
      include: {
        widgets: true,
      },
    });
  }

  // get a service by its ID
  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        widgets: true,
        _count: {
          select: {
            widgets: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ${id} not found`);
    }

    return service;
  }

  // get service by its name
  async findName(name: string) {
    const service = await this.prisma.service.findUnique({
      where: { name },
      include: {
        widgets: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ${name} not found`);
    }

    return service;
  }

  async findUserServices(userId: string) {
    return this.prisma.userService.findMany({
      where: { userId, isActive: true },
      include: {
        service: {
          include: {
            widgets: true,
          },
        },
      },
    });
  }
}
