import { forwardRef, Module } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [ClinicsController],
  imports: [DatabaseModule, forwardRef(() => AuthModule), JwtModule],
  providers: [ClinicsService],
})
export class ClinicsModule {}
