import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [GmailService],
  controllers: [GmailController],
  exports: [GmailService],
})
export class GmailModule {}
