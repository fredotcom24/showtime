/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Concert, ConcertGenre, Prisma } from '@prisma/client';
import { CreateConcertDto } from './dto/create-concert.dto';
import { UpdateConcertDto } from './dto/update-concert.dto';
import { FilterConcertDto } from './dto/filter-concert.dto';

@Injectable()
export class ConcertsService {
  constructor(private prisma: PrismaService) {}

  async create(createConcertDto: CreateConcertDto): Promise<Concert> {
    if (new Date(createConcertDto.date) <= new Date()) {
      throw new BadRequestException('Concert date must be in future');
    }

    return this.prisma.concert.create({
      data: {
        name: createConcertDto.title,
        description: createConcertDto.description,
        genre: createConcertDto.genre as ConcertGenre,
        date: new Date(createConcertDto.date),
        location: createConcertDto.location,
        totalSeats: createConcertDto.totalTickets,
        availableSeats: createConcertDto.totalTickets,
        price: createConcertDto.price,
        image: createConcertDto.imageUrl,

        // create relation if groupId is given
        ...(createConcertDto.groupIds &&
          createConcertDto.groupIds.length > 0 && {
            groups: {
              connect: createConcertDto.groupIds.map((groupId) => ({
                id: groupId,
              })),
            },
          }),
      },
      include: {
        groups: true,
      },
    });
  }

  async findAll(filterDto: FilterConcertDto) {
  const {
    genre,
    dateFrom,
    dateTo,
    groupId,
    search,
    page = 1,
    limit = 10,
  } = filterDto;

  const skip = (page - 1) * limit;

  const today = new Date();
  const twoMonthsLater = new Date();
  twoMonthsLater.setMonth(today.getMonth() + 2);

  const effectiveDateFrom = dateFrom || today;
  const effectiveDateTo = dateTo || twoMonthsLater;

  const where: Prisma.ConcertWhereInput = {};

  if (genre) where.genre = genre as ConcertGenre;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (groupId) {
    where.groups = {
      some: {
        id: groupId,
      },
    };
  }

  where.date = {
    gte: new Date(effectiveDateFrom),
    lte: new Date(effectiveDateTo),
  };

  const [concerts, total] = await Promise.all([
    this.prisma.concert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'asc' },
      include: {
        groups: true,
      },
    }),
    this.prisma.concert.count({ where }),
  ]);

  return {
    data: concerts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    appliedFilters: {
      genre,
      search,
      groupId,
      dateFrom: new Date(effectiveDateFrom).toISOString().split('T')[0],
      dateTo: new Date(effectiveDateTo).toISOString().split('T')[0],
    },
  };
}

  async findOne(id: string): Promise<Concert> {
    const concert = await this.prisma.concert.findUnique({
      where: { id },
      include: {
        groups: true,
      },
    });

    if (!concert) {
      throw new NotFoundException(`Concert with Id ${id} is not found`);
    }

    return concert;
  }

  async findUpcoming(limit: number = 10): Promise<Concert[]> {
    const today = new Date();

    return this.prisma.concert.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: limit,
      include: {
        groups: true,
      },
    });
  }

  async update(id: string, updateConcertDto: UpdateConcertDto): Promise<Concert> {
    await this.findOne(id);

    return this.prisma.concert.update({
      where: { id },
      data: {
        name: updateConcertDto.title,
        description: updateConcertDto.description,
        genre: updateConcertDto.genre as ConcertGenre,
        date: updateConcertDto.date ? new Date(updateConcertDto.date) : undefined,
        location: updateConcertDto.location,
        price: updateConcertDto.price,
        image: updateConcertDto.imageUrl,

        ...(updateConcertDto.groupIds && {
          groups: {
            set: updateConcertDto.groupIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        groups: true,
      },
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.concert.delete({
      where: { id },
    });

    return { message: 'Concert deleted with success' };
  }

  async decrementTickets(id: string, quantity: number): Promise<Concert> {
    return this.prisma.concert.update({
      where: { id },
      data: {
        availableSeats: {
          decrement: quantity,
        },
      },
    });
  }

  async incrementTickets(id: string, quantity: number): Promise<Concert> {
    return this.prisma.concert.update({
      where: { id },
      data: {
        availableSeats: {
          increment: quantity,
        },
      },
    });
  }

  async addGroupToConcert(concertId: string, groupId: string) {
    // Vérifier que le concert existe
    await this.findOne(concertId);

    return this.prisma.concert.update({
      where: { id: concertId },
      data: {
        groups: {
          connect: { id: groupId },
        },
      },
      include: {
        groups: true,
      },
    });
  }

  async removeGroupFromConcert(concertId: string, groupId: string) {
    return this.prisma.concert.update({
      where: { id: concertId },
      data: {
        groups: {
          disconnect: { id: groupId },
        },
      },
    });
  }
}
