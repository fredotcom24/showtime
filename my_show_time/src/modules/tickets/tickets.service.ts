import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import prisma from 'lib/prisma';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  // Create
  async create(createTicketDto: CreateTicketDto) {
    return await prisma.$transaction(async (tx) => {
      // Check if concert exists and if there is seats
      const concert = await tx.concert.findUnique({
        where: { id: createTicketDto.concertId },
        select: {
          id: true,
          availableSeats: true,
          name: true,
        },
      });
      if (!concert) {
        throw new NotFoundException(
          `Concert with ID ${createTicketDto.concertId} is not found`,
        );
      }
      if (concert.availableSeats <= 0) {
        throw new ConflictException(`No seats available for ${concert.name}`);
      }

      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: createTicketDto.userId },
        select: {
          id: true,
          username: true,
        },
      });
      if (!user) {
        throw new NotFoundException(
          `User with ID ${createTicketDto.userId} is not found`,
        );
      }

      // Generate a unique identifier
      const ticketCode = createTicketDto.concertId;

      // Finally create the ticket
      const ticket = await tx.ticket.create({
        data: {
          ...createTicketDto,
          qrCode: ticketCode,
          status: 'BOOKED',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          concert: {
            select: {
              id: true,
              name: true,
              date: true,
              location: true,
              price: true,
            },
          },
        },
      });

      // Decrease the number of available seats
      await tx.concert.update({
        where: { id: createTicketDto.concertId },
        data: {
          availableSeats: { decrement: 1 },
        },
      });

      const link = `http://localhost:3000/concerts/${ticket.concertId}`;
      return {
        ...ticket,
        qrCodeUrl: `https://quickchart.io/qr?text=${link}&size=300`,
        // Check that ticket.concert exists before using it
        concert: ticket.concert
          ? {
              ...ticket.concert,
              formattedDate: new Date(ticket.concert.date).toLocaleDateString(
                'en-US',
                {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              ),
            }
          : null,
      };
    });
  }

  // Read all tickets
  async findAll() {
    const tickets = await prisma.ticket.findMany({
      include: {
        user: true,
        concert: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return tickets;
  }

  // Read one ticket
  async findOne(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: true,
        concert: {
          include: {
            groups: true,
          },
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} is not found`);
    }

    return ticket;
  }

  // Delete a ticket
  async remove(id: string) {
    return await prisma.$transaction(async (tx) => {
      // Check if ticket exists
      const ticket = await tx.ticket.findUnique({
        where: { id },
        include: {
          user: true,
          concert: {
            include: {
              groups: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${id} is not found`);
      }

      const concertId = ticket.concertId;
      if (!concertId) {
        throw new ConflictException(
          `Ticket with ID ${id} is not associated to a concert`,
        );
      }

      // Finally delete the ticket
      await tx.ticket.delete({ where: { id } });

      // Restore the seat
      await tx.concert.update({
        where: { id: concertId },
        data: {
          availableSeats: { increment: 1 },
        },
      });

      return { message: 'Ticket removed successfuly' };
    });
  }

  async findByUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} is not found`);
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        concert: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return tickets;
  }
}
