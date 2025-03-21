import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersToClinicsProvider } from './usersToClinics.provider';
import { ClinicsModule } from 'src/clinics/clinics.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersToClinicsProvider],
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => ClinicsModule),
    JwtModule,
    DatabaseModule,
  ],
  exports: [UsersService],
})
export class UsersModule {}
