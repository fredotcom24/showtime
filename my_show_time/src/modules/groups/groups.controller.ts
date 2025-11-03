import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Render,
  Res,
  Query,
  Req,
} from '@nestjs/common';
import express from 'express';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { FilterConcertDto } from '../concerts/dto/filter-concert.dto';
import type { Request, Response } from 'express';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // GET /bands/create
  @Get('create')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @Render('admin/bands/create')
  createGroup() {
    return {};
  }

  // GET /bands/:id/edit
  @Get(':id/edit')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @Render('admin/bands/edit')
  async editGroup(@Param('id') id: string) {
    const band = await this.groupsService.findOne(id);
    return { band };
  }

  // CREATE - POST /groups
  @Post()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createGroupDto: CreateGroupDto,
    @Res() res: express.Response,
  ) {
    await this.groupsService.create(createGroupDto);
    return res.redirect('/groups');
  }

  
  // READ ALL - GET /groups
  @Get()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @Render('admin/bands/list')
  async listGroup() {
    const bands = await this.groupsService.findAll();
    // console.log(bands);
    return { bands };
  }

    // READ ALL view users - GET /groups
  @Get('users')
  @Render('site/list_group')
  async allListGroup(@Query() filterDto: FilterConcertDto,@Req() req: Request, @Res() res: Response) {
    const bands = await this.groupsService.findAll();
  
      const userCookie = req.cookies?.currentUser;
      const userData = JSON.parse(userCookie);
    // console.log(bands);
    return { user: userData.user,bands };
  }

  // @Get('users')
  // @Render('site/list_group')
  // async allListGroup() {
  //   const bands = await this.groupsService.findAll();
  //   // console.log(bands);
  //   return { bands };
  // }
  // UPDATE - PUT /groups/:id
  @Post(':id')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.FOUND)
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Res() res: express.Response,
  ) {
    await this.groupsService.update(id, updateGroupDto);
    return res.redirect('/groups');
  }

  // DELETE - DELETE /groups/:id
  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.groupsService.remove(id);
    return { success: true };
  }

  // READ ONE - GET /groups/:id
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GroupResponseDto> {
    return this.groupsService.findOne(id);
  }
}
