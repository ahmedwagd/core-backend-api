import { forwardRef, Module } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ClinicsUsersProvider } from './clinicsUsers.provider';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [ClinicsController],
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    DatabaseModule,
    JwtModule,
  ],
  providers: [ClinicsService, ClinicsUsersProvider],
  exports: [ClinicsService, ClinicsUsersProvider],
})
export class ClinicsModule {}
