import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateWidgetInstanceDto } from './dto/create-widget-instance.dto';
import { UpdateWidgetInstanceDto } from './dto/update-widget-instance.dto';

@Injectable()
export class WidgetInstancesService {
  constructor(private prisma: PrismaService) {}

  // Get all widget instances for a user
  async getUserWidgetInstances(userId: string) {
    return this.prisma.widgetInstance.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        widget: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // Create a new widget instance
  async createWidgetInstance(
    userId: string,
    dto: CreateWidgetInstanceDto,
  ) {
    // Verify widget exists
    const widget = await this.prisma.widget.findUnique({
      where: { id: dto.widgetId },
      include: { service: true },
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    // If widget requires auth, verify user has connected the service
    if (widget.service.requiresAuth) {
      const userService = await this.prisma.userService.findFirst({
        where: {
          userId,
          serviceId: widget.serviceId,
          isActive: true,
        },
      });

      if (!userService) {
        throw new BadRequestException(
          `You must connect ${widget.service.displayName} service first`,
        );
      }
    }

    // Create widget instance
    return this.prisma.widgetInstance.create({
      data: {
        userId,
        widgetId: dto.widgetId,
        config: dto.config || {},
        refreshRate: dto.refreshRate || widget.refreshRate,
        isActive: true,
      },
      include: {
        widget: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Update a widget instance
  async updateWidgetInstance(
    userId: string,
    instanceId: string,
    dto: UpdateWidgetInstanceDto,
  ) {
    // Verify instance exists and belongs to user
    const instance = await this.prisma.widgetInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException('Widget instance not found');
    }

    if (instance.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to update this widget instance',
      );
    }

    // Update instance
    return this.prisma.widgetInstance.update({
      where: { id: instanceId },
      data: {
        ...(dto.config && { config: dto.config }),
        ...(dto.refreshRate && { refreshRate: dto.refreshRate }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        widget: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Delete a widget instance
  async deleteWidgetInstance(userId: string, instanceId: string) {
    // Verify instance exists and belongs to user
    const instance = await this.prisma.widgetInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException('Widget instance not found');
    }

    if (instance.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to delete this widget instance',
      );
    }

    // Delete instance
    await this.prisma.widgetInstance.delete({
      where: { id: instanceId },
    });

    return {
      message: 'Widget instance deleted successfully',
    };
  }

  // Get a single widget instance
  async getWidgetInstance(userId: string, instanceId: string) {
    const instance = await this.prisma.widgetInstance.findUnique({
      where: { id: instanceId },
      include: {
        widget: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('Widget instance not found');
    }

    if (instance.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to view this widget instance',
      );
    }

    return instance;
  }
}
