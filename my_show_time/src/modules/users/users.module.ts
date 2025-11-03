import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
// import { UploadModule } from '../upload/upload.module';


@Module({
  // imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class usersModule {}
