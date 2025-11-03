import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  Render,
  Res,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // CREATE - POST /tickets
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  // READ ALL - GET /tickets
  @Get()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.ticketsService.findAll();
  }

  // READ ONE - GET /tickets/:id
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  // DELETE - DELETE /tickets/:id
  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  // GET /tickets/:id/detail
  @Get(':id/detail')
  @UseGuards(AuthGuard)
  @Render('tickets/ticket')
  async ticket(@Param('id') id: string) {
    const ticket = await this.ticketsService.findOne(id);
    return { ticket };
  }

  // GET /tickets/user/:userId/list
  @Get('user/:userId/list')
  @UseGuards(AuthGuard)
  @Render('tickets/userTickets')
  async userTicketsPage(@Param('userId') userId: string, @Res() res: Response) {
    const tickets = await this.ticketsService.findByUser(userId);
    return res.render('tickets/userTickets', { tickets: tickets });
  }
  
      
      // ADD BOUGHT TICKET - /tickets/:userId/pay/:concertId/:price
      @Get(':userId/pay/:concertId/:price')
      async addBoughtTicket(
        @Param('userId') userId: string,
        @Param('concertId') concertId: string,
        @Param('price') price: number,
        @Res() res: Response
      ) {
          const newTicket = await this.ticketsService.create({
            userId: userId,
            concertId: concertId,
            price: price,
          });

          if (newTicket){
            return res.redirect( '/tickets/' + newTicket?.id + '/detail');
          } else {
            return res.redirect('/payments/success');
          }
      }
}
