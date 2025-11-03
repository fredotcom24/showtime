import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import prisma from 'lib/prisma';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { plainToInstance } from 'class-transformer';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, private readonly mailService: MailerService, private readonly userService: UsersService) {}

  async register(data: RegisterDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    if (data.password !== data.passwordConfirmation){
      throw new BadRequestException("Passwords don't match");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        image: data.image || null,
      },
    });

    await this.sendMail(user.id);

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        image: user.image,
      },
    };
  }


  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        image: user.image,
      },
    };
  }


  // Check and decode the token
  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token); 
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          image: true,
          favoriteBands: true,
        },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        image: user.image,
        favoriteBands: user.favoriteBands,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }


  async sendMail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      tickets: {
        include: {
          concert: true
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  const verificationLink = `http://localhost:3000/auth/confirm-email/${user.id}`;

  const message = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #FF214F; padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">ShowTime</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <h2 style="color: #333333; margin: 0 0 20px 0;">Welcome to ShowTime!</h2>
                    <p style="color: #666666; font-size: 16px; margin: 0 0 30px 0;">
                      Hi <strong style="color: #FF214F;">${user.username || 'there'}</strong>, please verify your email to get started.
                    </p>
                    
                    <!-- Button -->
                    <a href="${verificationLink}" 
                       style="display: inline-block; 
                              padding: 16px 40px; 
                              background-color: #FF214F; 
                              color: #ffffff; 
                              text-decoration: none; 
                              border-radius: 6px; 
                              font-weight: bold; 
                              font-size: 16px;">
                      Verify Email
                    </a>
                    
                    <p style="color: #999999; font-size: 13px; margin: 30px 0 0 0;">
                      Or copy this link:<br>
                      <a href="${verificationLink}" style="color: #FF214F; word-break: break-all; font-size: 12px;">
                        ${verificationLink}
                      </a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © 2025 ShowTime. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const response = await this.mailService.sendMail({
    from: 'Show Time <kingiscoding@gmail.com>',
    to: user.email,
    subject: 'Account Verification - ShowTime',
    html: message,
  });

  return response;
}


  async confirmMail(id: string) {
    const updatedUser = this.userService.update(id, {
      verified: true
    });
    return this.userService.excludePassword(updatedUser);
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
