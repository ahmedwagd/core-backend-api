import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersToClinicsProvider } from 'src/users/usersToClinics.provider';
import { ClinicsModule } from 'src/clinics/clinics.module';
import { ProfilesModule } from 'src/profiles/profiles.module';

@Module({
  imports: [
    // MailModule,
    forwardRef(() => UsersModule),
    forwardRef(() => ClinicsModule),
    forwardRef(() => ProfilesModule),
    // PassportModule,
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: configService.get<string>('JWT_EXP_IN') },
        };
      },
    }),
  ],
  providers: [AuthService, UsersService, UsersToClinicsProvider],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
