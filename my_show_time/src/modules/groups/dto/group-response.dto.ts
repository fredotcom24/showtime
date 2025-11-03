import { ConcertGenre } from '@prisma/client';

export class GroupResponseDto {
  id: string;
  name: string;
  bio: string;
  genre: ConcertGenre;
  fanIds: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<GroupResponseDto>) {
    Object.assign(this, partial);
  }
}
