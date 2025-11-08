import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ======================= API ROUTES ======================

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}`;

    return res.redirect(redirectUrl);

    // return res.json(result);

    // return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}`);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @Delete('account')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: any) {
    await this.prisma.user.delete({
      where: { id: user.userId },
    });
    return { message: 'Account deleted successfully' };
  }

  @Get('verify-email/:id')
  async sendMailer(@Param('id') id: string) {
    await this.authService.sendMail(id);
    return {
      message: 'Verification email sent successfully',
      userId: id,
    };
  }

  @Get('confirm-email/:id')
  async confirmMail(@Param('id') id: string) {
    const user = await this.authService.confirmMail(id);
    return {
      message: 'Email verified successfully',
      user,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout() {
    return {
      message: 'Logged out successfully',
    };
  }
}
