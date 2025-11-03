import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Patch,
  Render,
  Res,
  Req,
} from '@nestjs/common';
import express from 'express';
import { ConcertsService } from './concerts.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { UpdateConcertDto } from './dto/update-concert.dto';
import { FilterConcertDto } from './dto/filter-concert.dto';
import { GroupsService } from '../groups/groups.service';
import type { Request, Response } from 'express';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('concerts')
export class ConcertsController {
  constructor(
    private readonly concertsService: ConcertsService,
    private readonly groupsService: GroupsService,
  ) {}

  // GET concerts/filter
  @Get('filter')
  @Render('concerts/filter')
  async filterPage() {
    const groups = await this.groupsService.findAll();
    return {
      groups,
      concerts: [],
      filters: {},
    };
  }

  // GET concerts/create
  @Get('create')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @Render('admin/concerts/create')
  async createConcert() {
    const bands = await this.groupsService.findAll();
    return { bands };
  }

  // SEARCH WITH FILTERS - GET /concerts/search
  @Get('search')
  @Render('concerts/filter')
  async searchConcerts(@Query() filterDto: FilterConcertDto) {
    console.log(filterDto);
    const concertsResult = await this.concertsService.findAll(filterDto);
    const groups = await this.groupsService.findAll();

    return {
      groups,
      concerts: concertsResult.data,
      pagination: concertsResult.pagination,
      filters: concertsResult.appliedFilters,
    };
  }

  // CREATE - POST /concerts
  @Post()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createConcertDto: CreateConcertDto,
    @Res() res: express.Response,
  ) {
    await this.concertsService.create(createConcertDto);
    return res.redirect('/concerts/admin');
  }

  // READ ALL - GET /concerts
  @Get()
  // @Render('site/list_concert')
  async findAll(@Query() filterDto: FilterConcertDto,@Req() req: Request, @Res() res: Response) {
    const concertsResult = await this.concertsService.findAll(filterDto);
    const groups = await this.groupsService.findAll();
    return res.render('site/list_concert', {
      concerts: concertsResult.data,
      pagination: concertsResult.pagination,
      groups,
    });
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @Render('admin/concerts/list')
  async findAllAdmin(@Query() filterDto: FilterConcertDto) {
    const concertsResult = await this.concertsService.findAll(filterDto);
    return {
      concerts: concertsResult.data,
      pagination: concertsResult.pagination,
    };
  }

  // READ UPCOMING - GET /concerts/upcoming
  @Get('upcoming')
  findUpcoming(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.concertsService.findUpcoming(parsedLimit);
  }

  // READ ONE - GET /concerts/:id
  @Get(':id')
  @Render('site/detail_concert')
  async findOne(@Param('id') id: string,@Req() req: Request,@Res() res: Response) {
    const concert = await this.concertsService.findOne(id);
    return { concert };
  }

  // GET /concerts/:id/edit
  @Get(':id/edit')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @Render('admin/concerts/edit')
  async editConcert(@Param('id') id: string) {
    const concert = await this.concertsService.findOne(id);
    const bands = await this.groupsService.findAll();
    return { concert, bands };
  }

  // UPDATE - PUT /concerts/:id
  @Post(':id')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.FOUND)
  async update(
    @Param('id') id: string,
    @Body() updateConcertDto: UpdateConcertDto,
    @Res() res: express.Response,
  ) {
    await this.concertsService.update(id, updateConcertDto);
    return res.redirect('/concerts/admin');
  }

  // DECREMENT TICKETS - PATCH /concerts/:id/tickets/decrement
  @Patch(':id/tickets/decrement')
  decrementTickets(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.concertsService.decrementTickets(id, quantity);
  }

  // INCREMENT TICKETS - PATCH /concerts/:id/tickets/increment
  @Patch(':id/tickets/increment')
  incrementTickets(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.concertsService.incrementTickets(id, quantity);
  }

  // ADD GROUP - POST /concerts/:id/groups
  @Post(':id/groups')
  // @UseGuards(AuthGuard)
  // @Roles('ADMIN')
  addGroupToConcert(@Param('id') id: string, @Body('groupId') groupId: string) {
    return this.concertsService.addGroupToConcert(id, groupId);
  }

  // REMOVE GROUP - DELETE /concerts/:id/groups/:groupId
  @Delete(':id/groups/:groupId')
  // @UseGuards(AuthGuard)
  // @Roles('ADMIN')
  removeGroupFromConcert(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ) {
    return this.concertsService.removeGroupFromConcert(id, groupId);
  }

  // DELETE - DELETE /concerts/:id
  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.concertsService.remove(id);
    return { success: true };
  }
}
