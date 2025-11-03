import { IsString, IsInt, IsPositive, IsNotEmpty } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  concertId: string;

  @IsInt()
  @IsPositive()
  price: number;
}
