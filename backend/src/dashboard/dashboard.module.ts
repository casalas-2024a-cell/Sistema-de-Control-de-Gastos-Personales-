// [FILE] dashboard/dashboard.module.ts
// Bundles the analytics controller and service.
// Imports AuthModule to gain access to JwtAuthGuard (exported by AuthModule).
// PrismaModule is global (@Global), so DashboardService gets PrismaService automatically.

import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  // Import AuthModule to make JwtAuthGuard available for @UseGuards() in the controller.
  // WHY: JwtAuthGuard depends on JwtStrategy which is registered in AuthModule.
  // Without importing AuthModule here, the guard cannot find its Passport strategy.
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
