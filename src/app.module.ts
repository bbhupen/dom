import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FleetModule } from './fleet/fleet.module';
import { MissionsModule } from './missions/missions.module';
import { OperationsModule } from './operations/operations.module';
import { PilotsModule } from './pilots/pilots.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [AuthModule, RequestsModule, MissionsModule, FleetModule, PilotsModule, OperationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
