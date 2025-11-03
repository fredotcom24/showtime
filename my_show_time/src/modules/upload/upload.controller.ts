import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    const imageUrl = await this.uploadService.uploadImage(file, 'profiles');
    return {
      url: imageUrl,
      message: 'Image uploaded successfully',
    };
  }

  @Post('concert')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadConcertImage(@UploadedFile() file: Express.Multer.File) {
    const isValid = this.uploadService.checkFile(file)
    if (isValid) {
        const imageUrl = await this.uploadService.uploadImage(file, 'concerts');
        return {
            url: imageUrl,
            message: 'Image uploaded successfully',
        };
    }
  }

  @Post('group')
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadGroupImage(@UploadedFile() file: Express.Multer.File) {
    const isValid = this.uploadService.checkFile(file)
    if (isValid) {
        const imageUrl = await this.uploadService.uploadImage(file, 'groups');
        return {
            url: imageUrl,
            message: 'Image uploaded successfully',
        };
    }
  }
}