import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserServicesService {
  constructor(private prisma: PrismaService) {}

  // Récupérer tous les services de l'utilisateur
  async getUserServices(userId: string) {
    return this.prisma.userService.findMany({
      where: { userId },
      include: {
        service: true,
      },
    });
  }

  // Activer un service
  async activateService(userId: string, serviceId: string) {
    // Vérifier que le service existe
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Vérifier si déjà activé
    const existing = await this.prisma.userService.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Service already activated');
    }

    // Créer la connexion
    return this.prisma.userService.create({
      data: {
        userId,
        serviceId,
        isActive: true,
      },
      include: {
        service: true,
      },
    });
  }

  // Sauvegarder les tokens OAuth après callback
  async saveGmailTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    const emailService = await this.prisma.service.findUnique({
      where: { name: 'email' },
    });

    if (!emailService) {
      throw new NotFoundException(
        'Gmail service not found in database. Please ensure the "email" service exists.',
      );
    }

    const result = await this.prisma.userService.upsert({
      where: {
        userId_serviceId: {
          userId,
          serviceId: emailService.id,
        },
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
        isActive: true,
      },
      create: {
        userId,
        serviceId: emailService.id,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
        isActive: true,
      },
      include: {
        service: true,
      },
    });

    return result;
  }

  // Sauvegarder les tokens Google Drive OAuth après callback
  async saveGoogleDriveTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    const driveService = await this.prisma.service.findUnique({
      where: { name: 'google_drive' },
    });

    if (!driveService) {
      throw new NotFoundException(
        'Google Drive service not found in database. Please ensure the "google_drive" service exists.',
      );
    }

    const result = await this.prisma.userService.upsert({
      where: {
        userId_serviceId: {
          userId,
          serviceId: driveService.id,
        },
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
        isActive: true,
      },
      create: {
        userId,
        serviceId: driveService.id,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
        isActive: true,
      },
      include: {
        service: true,
      },
    });

    return result;
  }

  // Sauvegarder les tokens Calendar OAuth après callback
  async saveCalendarTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    const calendarService = await this.prisma.service.findUnique({
      where: { name: 'calendar' },
    });

    if (!calendarService) {
      throw new NotFoundException(
        'Calendar service not found in database. Please ensure the "calendar" service exists.',
      );
    }

    const result = await this.prisma.userService.upsert({
      where: {
        userId_serviceId: {
          userId,
          serviceId: calendarService.id,
        },
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
        isActive: true,
      },
      create: {
        userId,
        serviceId: calendarService.id,
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
        isActive: true,
      },
      include: {
        service: true,
      },
    });

    return result;
  }

  // Désactiver un service
  async deactivateService(userId: string, serviceId: string) {
    const userService = await this.prisma.userService.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
    });

    if (!userService) {
      throw new NotFoundException('Service not activated');
    }

    await this.prisma.userService.delete({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
    });

    return {
      message: 'Service deactivated successfully',
    };
  }
}
