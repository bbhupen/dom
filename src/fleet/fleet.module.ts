import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [FleetController],
  providers: [FleetService],
})
export class FleetModule {}
