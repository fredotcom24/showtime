import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  Put,
  Patch,
  Render,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  ConflictException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from '@prisma/client';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { FilterConcertDto } from '../concerts/dto/filter-concert.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // GET /users/create
  @Get('create')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @Render('admin/users/create')
  createUser() {
    return {};
  }

  // ======================= API ROUTES ======================

  // CREATE - POST /users
  @Post()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    await this.usersService.create(createUserDto);
    return res.redirect('/users');
  }

  // READ ALL - GET /users
  @Get()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @Render('admin/users/list')
  async listPage() {
    const users = await this.usersService.findAll();
    return { users };
  }

  // READ ONE - GET /users/:id
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  // UPDATE - PUT /users/:id
  @Post(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
  ) {
    await this.usersService.update(id, updateUserDto);
    return res.redirect('/users');
  }

  // UPDATE PASSWORD - PATCH /users/:id/password
  @Patch(':id/password')
  @UseGuards(AuthGuard)
  async updatePassword(
    @Param('id') id: string,
    @Res() res: Response,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = this.usersService.updatePassword(id, updatePasswordDto);

    return res.redirect('/auth/logout');
  }

  // UPDATE ROLE (ADMIN) - PATCH /users/:id/role
  @Patch(':id/role')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(id, role);
  }

  // ADD FAVORITE GROUP - POST /users/:id/favorites/groups
  @Post(':id/favorites/groups')
  @UseGuards(AuthGuard)
  async addFavoriteGroup(
    @Param('id') id: string,
    @Body('groupId') groupId: string,
    @Res() res: Response
  ) {
    const updatedUser = await this.usersService.addFavoriteGroup(id, groupId);
    return res.render('site/list_group', { user: updatedUser });
  }

  // GET /users/wishlist
  @Get('wishlist')
  @UseGuards(AuthGuard)
  @Render('site/wishlist')
  async getWishlist(@Req() req: Request) {
    const userCookie = req.cookies?.currentUser;
    if (!userCookie) return { concerts: [], title: 'My Wishlist' };

    const userData = JSON.parse(userCookie);

    const user = await this.usersService.findOne(userData.user.id);

    const wishListConcerts = user.wishListConcerts || [];
    console.log(wishListConcerts)
    return { wishListConcerts: wishListConcerts || [], title: 'My Wishlist' };

  }




  // REMOVE FAVORITE GROUP - DELETE /users/:id/favorites/groups/:groupId
  @Delete(':id/favorites/groups/:groupId')
  @UseGuards(AuthGuard)
  async removeFavoriteGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string
  ): Promise<UserResponseDto> {
    return this.usersService.removeFavoriteGroup(id, groupId);
  }

  // ADD TO WISHLIST - POST /users/:id/wishlist
  @Post(':id/wishlist')
  @UseGuards(AuthGuard)
  async addToWishlist(
    @Param('id') id: string,
    @Body('concertId') concertId: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const updatedUser = await this.usersService.addToWishlist(id, concertId);
      this.updateCurrentUserCookie(req, res, updatedUser);
      return res.redirect('/concerts');

    } catch (error) {
      if (error instanceof ConflictException) {
        return res.redirect('/concerts');
      }
      throw error;
    }
  }


  // REMOVE FROM WISHLIST - DELETE /users/:id/wishlist/:concertId
  @Get(':id/wishlist/remove/:concertId')
  @UseGuards(AuthGuard)
  async removeFromWishlist(
    @Param('id') id: string,
    @Param('concertId') concertId: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const updatedUser = await this.usersService.removeFromWishlist(id, concertId);
      this.updateCurrentUserCookie(req, res, updatedUser);
      return res.redirect(req.headers.referer || '/');
    } catch (error) {
      if (error instanceof ConflictException) {
        return res.redirect(req.headers.referer || '/');
      }
      throw error;
    }
  }


  // DELETE - DELETE /users/:id
  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { success: true };
  }


  // ======================= VIEW ROUTES ======================

  // PROFILE PAGE - GET /users/profile
  @Get(':id/profile')
  @UseGuards(AuthGuard)
  async getProfilePage(@Req() req: Request, @Res() res: Response) {
    try {
      const userCookie = req.cookies?.currentUser;
      if (!userCookie) {
        return res.redirect('/auth/login');
      }

      const userData = JSON.parse(userCookie);
      const user = await this.usersService.findOne(userData.user.id);
      console.log('DEBUG - profile', user);
      return res.render('users/profile', {
        title: 'My Profile - ShowTime',
        user: user,
        errors: null,
        success: null
      });
    } catch (error) {
      return res.render('users/profile', {
        title: 'My Profile - ShowTime',
        user: null,
        errors: { message: error.message || 'Failed to load profile' },
        success: null
      });
    }
  }

  // EDIT PROFILE PAGE - GET /users/profile/edit
  @Get(':id/profile/edit')
  @UseGuards(AuthGuard)
  async getEditProfilePage(@Req() req: Request, @Res() res: Response) {
    try {
      const userCookie = req.cookies?.currentUser;
      if (!userCookie) {
        return res.redirect('/auth/login');
      }

      const userData = JSON.parse(userCookie);
      const user = await this.usersService.findOne(userData.user.id);

      return res.render('users/edit_profile', {
        title: 'Edit Profile - ShowTime',
        user: user,
        errors: null
      });
    } catch (error) {
      return res.render('users/edit_profile', {
        title: 'Edit Profile - ShowTime',
        user: null,
        errors: { message: error.message || 'Failed to load profile' }
      });
    }
  }

  // UPDATE PROFILE - POST /users/profile/edit
  @Post(':id/profile/edit')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profile'))
  async updateProfile(
    @Req() req: Request,
    @Res() res: Response,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const userCookie = req.cookies?.currentUser;
      if (!userCookie) {
        return res.redirect('/auth/login');
      }

      const userData = JSON.parse(userCookie);

      // Handle file upload if present
      if (file) {
        const uploadedImageUrl = await this.usersService.uploadImage(file, 'profile');
        updateUserDto.image = uploadedImageUrl;
      }

      const updatedUser = await this.usersService.update(userData.user.id, updateUserDto);
      this.updateCurrentUserCookie(req, res, updatedUser);
      // Update cookie
      console.log('DEBUG - update profile');
      return res.redirect('/users/' + updatedUser.id + '/profile');
    } catch (error) {
      const user = await this.usersService.findOne(JSON.parse(req.cookies.currentUser).user.id);
      return res.render('users/edit_profile', {
        title: 'Edit Profile - ShowTime',
        user: user,
        errors: { message: error.message || 'Failed to update profile' }
      });
    }
  }

  // CHANGE PASSWORD PAGE - GET /users/profile/change-password
  @Get(':id/profile/change-password')
  @UseGuards(AuthGuard)
  // @Render('users/change_password')
  getChangePasswordPage(@Req() req: Request, @Res() res: Response) {
    const userCookie = req.cookies?.currentUser;

    return res.render('users/change_password', {
      title: 'Change Password - ShowTime',
      user: userCookie ? JSON.parse(userCookie).user : null,
      errors: null,
      success: null,
    });
  }

  // UPDATE PASSWORD - POST /users/profile/change-password
  @Post(':id/profile/change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    try {
      const userCookie = req.cookies?.currentUser;
      if (!userCookie) {
        return res.redirect('/auth/login');
      }

      // console.log('DEBUG - change pwd page');
      const userData = JSON.parse(userCookie);
      await this.usersService.updatePassword(userData.user.id, updatePasswordDto);
      // return res.render('users/change_password', {
      //   title: 'Change Password - ShowTime',
      //   user: userData.user,
      //   errors: null,
      //   success: { message: 'Password changed successfully!' }
      // });
      return res.redirect('/auth/logout');
    } catch (error) {
      const userData = JSON.parse(req.cookies.currentUser);
      return res.render('users/change_password', {
        title: 'Change Password - ShowTime',
        user: userData.user,
        errors: { message: error.message || 'Failed to change password' },
        success: null
      });
    }
  }

  // GET /users/:id/edit
  @Get(':id/edit')
  @UseGuards(AuthGuard)
  @Render('admin/users/edit')
  async editPage(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return { user };
  }

  updateCurrentUserCookie(req: Request, res: Response, newUser: any) {
    let currentUser: any;
    try {
      const cookie = req.cookies.currentUser;
      if (cookie) {
        currentUser = JSON.parse(cookie);
        currentUser.user = newUser;
      } else {
        currentUser = { accessToken: '', user: newUser };
      }
    } catch (err) {
      currentUser = { accessToken: '', user: newUser };
    }

    res.cookie('currentUser', JSON.stringify(currentUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
}
