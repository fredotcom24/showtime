import { Body, Controller, Post, Get, UseGuards, Res, Req, Param, Render, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ======================= API ROUTES ======================

  @Post('register')
  @UseInterceptors(FileInterceptor('profile'))
  async register(@Body() data: RegisterDto, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    try {
      const isValid = this.authService.checkFile(file);
      if (!isValid) {
        return res.render('auth/register', { 
          title: 'Register - ShowTime',
          errors: { message: 'Invalid file type' } 
        });
      }

      const imageUrl = await this.authService.uploadImage(file, 'profile');
      if (!imageUrl) {
        return res.render('auth/register', { 
          title: 'Register - ShowTime',
          errors: { message: 'Profile upload failed' } 
        });
      }

      data.image = imageUrl;
      const result = await this.authService.register(data);

      res.cookie('currentUser', JSON.stringify(result), {
        httpOnly: true,
        // sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect('/auth/verify-email');
    } catch (error) {
      return res.render('auth/register', { 
        title: 'Register - ShowTime',
        errors: { message: error.message || 'Registration failed' } 
      });
    }
  }

  @Post('login')
  async login(@Body() data: LoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.login(data);

      res.cookie('currentUser', JSON.stringify(result), {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
        httpOnly: true,
      });

      return res.redirect('/');
    } catch (error) {
      return res.render('auth/login', { 
        title: 'Sign In - ShowTime',
        errors: { message: 'Something went wrong please check your internet connection and your inputs' } 
      });
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @Get('verify-email/:id')
  async sendMailer(@Res() res: Response, @Param('id') id: string) {
    try {
      await this.authService.sendMail(id);
      return res.status(200).json({
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Failed to send verification email',
      });
    }
  }

  @Get('confirm-email/:id')
  async confirmMail(@Res() res: Response, @Param('id') id: string) {
    try {
      await this.authService.confirmMail(id);
      return res.redirect('/auth/email-confirmed');
    } catch (error) {
      return res.render('error', {
        title: 'Verification Failed - ShowTime',
        statusCode: 400,
        message: error.message || 'Email verification failed'
      });
    }
  }

  @Get('logout')
  @UseGuards(AuthGuard)
  async logout(@Res() res: Response) {
    res.clearCookie('currentUser');
    return res.redirect('/auth/login');
  }

  // ======================= VIEW ROUTES ======================

  @Get('register')
  @Render('auth/register')
  getRegistrationPage() {
    return { title: 'Register - ShowTime', errors: null };
  }

  @Get('login')
  @Render('auth/login')
  getLoginPage() {
    return { title: 'Sign In - ShowTime', errors: null };
  }

  @Get('verify-email')
  verifyEmailPage(@Req() req: Request, @Res() res: Response) {
    try {
      const userCookie = req.cookies?.currentUser;
      const userData = userCookie ? JSON.parse(userCookie) : null;

      return res.render('auth/verify_email', {
        title: 'Verify Email - ShowTime',
        user: userData?.user || null,
        errors: null
      });
    } catch (error) {
      return res.render('auth/verify_email', {
        title: 'Verify Email - ShowTime',
        user: null,
        errors: { message: 'Failed to load user data' }
      });
    }
  }

  @Get('email-confirmed')
  @Render('auth/email_confirmed')
  emailConfirmedPage() {
    return { 
      title: 'Email Confirmed - ShowTime',
      message: 'Your email has been successfully verified!' 
    };
  }
}
