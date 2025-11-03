import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
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

  async deleteImage(imageUrl: string): Promise<void> {
    const publicId = this.extractPublicId(imageUrl);
    await cloudinary.uploader.destroy(publicId);
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
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


