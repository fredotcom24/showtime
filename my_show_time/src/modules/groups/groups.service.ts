import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupResponseDto } from './dto/group-response.dto';
import prisma from 'lib/prisma';

@Injectable()
export class GroupsService {
  // CREATE
  async create(createGroupDto: CreateGroupDto): Promise<GroupResponseDto> {
    const group = await prisma.group.create({
      data: { ...createGroupDto }
    });
    return group;
  }

  // READ ALL
  async findAll(): Promise<GroupResponseDto[]> {
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { concerts: true, fans: true }
        }
      }
    });
    return groups;
  }

  // READ ONE
  async findOne(id: string): Promise<GroupResponseDto> {
    const group = await prisma.group.findUnique({
      where: { id },
      include: { concerts: true, fans: true },
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    return group;
  }

  // UPDATE
  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<GroupResponseDto> {
    const groupUpdate = await prisma.group.update({
      where: { id },
      data: updateGroupDto,
    });
    return groupUpdate;
  }

  // DELETE
  async remove(id: string): Promise<void> {
    const group = await prisma.group.findUnique({ where: { id } });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    await prisma.group.delete({ where: { id } });
  }
}