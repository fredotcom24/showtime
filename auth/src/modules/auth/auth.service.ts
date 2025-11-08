import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly mailService: MailerService,
    private prisma: PrismaService,
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    if (data.password !== data.passwordConfirmation) {
      throw new BadRequestException("Passwords don't match");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
    });

    await this.sendMail(user.id);

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        authProvider: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
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
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        userId: user.id,
        email: user.email,
        username: user.username,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async sendMail(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
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
                    
                    <tr>
                      <td style="background-color: #1e293b; padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Dashboard</h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <h2 style="color: #333333; margin: 0 0 20px 0;">Welcome to Dashboard!</h2>
                        <p style="color: #666666; font-size: 16px; margin: 0 0 30px 0;">
                          Hi <strong style="color: #1e293b;">${user.username || 'there'}</strong>, please verify your email to get started.
                        </p>
                        
                        <a href="${verificationLink}" 
                           style="display: inline-block; 
                                  padding: 16px 40px; 
                                  background-color: #1e293b; 
                                  color: #ffffff; 
                                  text-decoration: none; 
                                  border-radius: 6px; 
                                  font-weight: bold; 
                                  font-size: 16px;">
                          Verify Email
                        </a>
                        
                        <p style="color: #999999; font-size: 13px; margin: 30px 0 0 0;">
                          Or copy this link:<br>
                          <a href="${verificationLink}" style="color: #1e293b; word-break: break-all; font-size: 12px;">
                            ${verificationLink}
                          </a>
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="color: #999999; font-size: 12px; margin: 0;">
                          © 2025 Dashboard. All rights reserved.
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
        from: 'Dashboard <pro.fredseo@gmail.com>',
        to: user.email,
        subject: 'Account Verification - Dashboard',
        html: message,
      });

      return response;
    } catch (error) {
      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  }

  async confirmMail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isVerified: true }
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      isVerified: updatedUser.isVerified,
    };
  }

  // Google OAuth
  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    const { email, username, providerId } = req.user;

    // check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // user found : update user info
      if (user.authProvider !== 'GOOGLE') {
        user = await this.prisma.user.update({
          where: { email },
          data: {
            authProvider: 'GOOGLE',
            authProviderId: providerId,
            isVerified: true,
          },
        });
      }
    } else {
      // user not found : create account
      user = await this.prisma.user.create({
        data: {
          email,
          username,
          authProvider: 'GOOGLE',
          authProviderId: providerId,
          isVerified: true,
          password: null,
        },
      });
    }

    // generate JWT
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        authProvider: user.authProvider,
      },
    };
  }
}
