import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PilotsController } from './pilots.controller';
import { PilotsService } from './pilots.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PilotsController],
  providers: [PilotsService],
})
export class PilotsModule {}
