import { Module } from '@nestjs/common';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import { PrismaModule } from 'prisma/prisma.module';
import { GroupsModule } from '../groups/groups.module';
import { AuthModule } from '../auth/auth.module';
import { FilterConcertDto } from './dto/filter-concert.dto';

@Module({
  imports: [PrismaModule, GroupsModule, AuthModule],
  controllers: [ConcertsController],
  providers: [ConcertsService],
  exports: [ConcertsService],
})
export class ConcertsModule {}
