// src/profiles/profiles.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService],
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    JwtModule,
    DatabaseModule,
  ],
  exports: [ProfilesService],
})
export class ProfilesModule {}
