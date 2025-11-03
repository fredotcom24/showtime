import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import prisma from 'lib/prisma';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User, UserRole } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UsersService {
  // CREATE
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await prisma.user.findUnique({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      }
    });
    return this.excludePassword(user);
  }

  // READ ALL
  async findAll(): Promise<UserResponseDto[]> {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { 
            tickets: true,
            favoriteGroups: true,
            wishListConcerts: true
          }
        }
      }
    });
    return users.map(user => this.excludePassword(user));
  }

  // READ ONE
  async findOne(id: string): Promise<UserResponseDto> {
    console.log('DEBUG', id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        tickets: {
          include: {
            concert: true
          }
        },
        favoriteGroups: true,
        wishListConcerts: true
      }
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.excludePassword(user);
  }

  // READ BY EMAIL (pour l'auth)
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  // UPDATE
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    // check if new email doesn't exists before
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateUserDto.email }
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // hash password 
    const dataToUpdate = { ...updateUserDto };
    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
    return this.excludePassword(updatedUser);
  }

  // UPDATE PASSWORD (avec vérification de l'ancien mot de passe)
  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<UserResponseDto> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    return this.excludePassword(updatedUser);
  }

  // UPDATE ROLE (admin only)
  async updateRole(id: string, role: UserRole): Promise<UserResponseDto> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    });
    return this.excludePassword(updatedUser);
  }

  // ADD FAVORITE GROUP (Many-to-Many)
  async addFavoriteGroup(userId: string, groupId: string): Promise<UserResponseDto> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify group exist
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // verify favorite
    if (user.favoriteBands.includes(groupId)) {
      throw new ConflictException('Group already in favorites');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        favoriteGroups: {
          connect: { id: groupId }
        }
      },
      include: {
        favoriteGroups: true
      }
    });
    return this.excludePassword(updatedUser);
  }

  // REMOVE FAVORITE GROUP (Many-to-Many)
  async removeFavoriteGroup(userId: string, groupId: string): Promise<UserResponseDto> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        favoriteGroups: {
          disconnect: { id: groupId }
        }
      },
      include: {
        favoriteGroups: true
      }
    });
    return this.excludePassword(updatedUser);
  }


async addToWishlist(userId: string, concertId: string): Promise<UserResponseDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  // Verify that concert exists
  const concert = await prisma.concert.findUnique({ where: { id: concertId } });
  if (!concert) {
    throw new NotFoundException(`Concert with ID ${concertId} not found`);
  }

  // verify if in wishlist
  if (user.wishList.includes(concertId)) {
    throw new ConflictException('Concert already in wishlist');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      wishListConcerts: {
        connect: { id: concertId },
      },
    },
    include: {
      wishListConcerts: true,
    },
  });
  
  return this.excludePassword(updatedUser);
}


  // REMOVE FROM WISHLIST (Many-to-Many)
  async removeFromWishlist(userId: string, concertId: string): Promise<UserResponseDto> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        wishListConcerts: {
          disconnect: { id: concertId }
        }
      },
      include: {
        wishListConcerts: true
      }
    });
    return this.excludePassword(updatedUser);
  }

  // DELETE
  async remove(id: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await prisma.user.delete({ where: { id } });
  }

  // Helper to exclude passwords
  excludePassword(user: any): UserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return new UserResponseDto(userWithoutPassword);
  }



    async uploadImage(file: Express.Multer.File, folder: string = 'my_show_time'): Promise<string> {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: folder,
              resource_type: 'auto',
            },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve(result.secure_url);
            },
          ).end(file.buffer);
        });
      }
  
      checkFile(file: Express.Multer.File){
          if (!file) {
              throw new BadRequestException('No file uploaded');
          }
          if (!file.mimetype.startsWith('image/')) {
              throw new BadRequestException('Only image files are allowed');
          }
          return true
        }
  
}