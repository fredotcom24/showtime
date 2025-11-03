import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { usersModule } from './modules/users/users.module';
import { GroupsModule } from './modules/groups/groups.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UploadModule } from './modules/upload/upload.module';
import { ConcertsModule } from './modules/concerts/concerts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UserMiddleware } from './middleware/user.middleware';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    usersModule,
    AuthModule,
    GroupsModule,
    TicketsModule,
    UploadModule,
    ConcertsModule,
    PaymentsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        secure: false,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule { 
  configure(consumer: MiddlewareConsumer) {    
    consumer
      .apply(UserMiddleware)
      .forRoutes('*'); 
  }
}