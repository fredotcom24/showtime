import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsOptional, IsString } from 'class-validator';
// import { TicketStatus } from 'generated/prisma';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
    
    @IsOptional()
    @IsString()
    status?: string
  
    @IsOptional()
    @IsString()
    qrCode?: string;

}

