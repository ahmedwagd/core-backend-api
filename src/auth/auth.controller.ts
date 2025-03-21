import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JWTPayloadType, UserType } from 'src/utils/global';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/user-role.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthRolesGuard } from './guards/auth-roles.guard';

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
  // Todo - logout
  @Post('logout')
  @ApiBearerAuth('access-token')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER, UserType.USER, UserType.DOCTOR)
  @UseGuards(AuthRolesGuard)
  public async logout(@CurrentUser() payload: JWTPayloadType) {
    return this._authService.logout(payload.id);
  }
  // @Get('refresh-token')
  // public async refreshToken(@Body() body: { refreshToken: string }) {
  //   return this._authService.refreshToken(body.refreshToken);
  // }

  @Get('current-user')
  @ApiBearerAuth('access-token')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER, UserType.USER, UserType.DOCTOR)
  @UseGuards(AuthRolesGuard)
  public getCurrentUser(@CurrentUser() payload: JWTPayloadType) {
    return this._authService.getCurrentUser(payload.id);
  }
  @Get('current-user-payload')
  @ApiBearerAuth('access-token')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER, UserType.USER, UserType.DOCTOR)
  @UseGuards(AuthRolesGuard)
  public getCurrentUserPay(@CurrentUser() payload: JWTPayloadType) {
    return this._authService.getCurrentUserPayload(payload);
  }

  // // Todo - change current clinics
  // @Patch('change-clinics')
  // @ApiBearerAuth('access-token')
  // @Roles(UserType.SUPERADMIN)
  // @UseGuards(AuthRolesGuard)
  // public changeClinics(
  //   @CurrentUser() payload: JWTPayloadType,
  //   @Body() body: { clinicId: number },
  // ) {
  //   return this._authService.changeClinics(payload, body.clinicId);
  // }

  @Patch('change-password')
  @ApiBearerAuth('access-token')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER, UserType.USER, UserType.DOCTOR)
  @UseGuards(AuthRolesGuard)
  public changePassword(
    @CurrentUser() payload: JWTPayloadType,
    @Body() body: ChangePasswordDto,
  ) {
    return this._authService.changePassword(payload.id, body);
  }

  // Todo - forgot password
  // Todo - reset password
}
