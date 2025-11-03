import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConcertsModule } from '../concerts/concerts.module';
import { AuthModule } from '../auth/auth.module';
// import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, ConcertsModule, AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
