import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JWTPayloadType } from 'src/utils/global';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from './guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}
  @Post('register')
  public async register(@Body() body: RegisterDto) {
    return this._authService.register(body);
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() body: LoginDto) {
    return this._authService.login(body);
  }
  @Get('current-user')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  public getCurrentUser(@CurrentUser() payload: JWTPayloadType) {
    return this._authService.getCurrentUser(payload.id);
  }
}
