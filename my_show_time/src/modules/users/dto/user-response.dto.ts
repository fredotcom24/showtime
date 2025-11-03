import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  username: string;
  image?: string;
  role: UserRole;
  verified: boolean;
  favoriteBands: string[];
  wishListConcerts?: String[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}