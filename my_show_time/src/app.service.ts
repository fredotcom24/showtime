import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FilterConcertDto } from './modules/concerts/dto/filter-concert.dto';


@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}
  getHello(): string {
    return 'Hello World!';
  }

  async findAll() {
 
    const [concerts] = await Promise.all([
      this.prisma.concert.findMany({ take: 3, orderBy: { createdAt: 'desc' } })
    ]);
    
    return {
      data: concerts,
      pagination: {
      },
    };
  }
}


