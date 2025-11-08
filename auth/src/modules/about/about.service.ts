import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AboutService {
  constructor(private prisma: PrismaService) {}

  async getAboutInfo(clientIp: string) {
    // Get all services with their widgets
    const services = await this.prisma.service.findMany({
      include: {
        widgets: true,
      },
    });

    // Build the response
    return {
      customer: {
        host: clientIp,
      },
      server: {
        current_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        services: services.map((service) => ({
          name: service.name,
          widgets: service.widgets.map((widget) => ({
            name: widget.name,
            description: widget.description,
            params: this.parseParamSchema(widget.paramSchema),
          })),
        })),
      },
    };
  }

  private parseParamSchema(paramSchema: any): Array<{ name: string; type: string }> {
    if (!paramSchema || typeof paramSchema !== 'object') {
      return [];
    }

    // paramSchema is expected to be a JSON object like:
    // { "city": "string", "units": "string" }
    return Object.entries(paramSchema).map(([name, type]) => ({
      name,
      type: String(type),
    }));
  }
}
