import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request } from 'express';
import { JWTPayloadType, UserType } from '../../utils/global';
import { CURRENT_USER_KEY } from '../../utils/constants';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
    private readonly _reflector: Reflector,
    private readonly _userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles: UserType[] = this._reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return false;

    const req: Request = context.switchToHttp().getRequest();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: JWTPayloadType = await this._jwtService.verifyAsync(
          token,
          {
            secret: this._configService.get<string>('JWT_SECRET'),
          },
        );
        const user = await this._userService.findOne(payload.id);
        if (!user) return false;
        if (roles.includes(user.userType as UserType)) {
          req[CURRENT_USER_KEY] = payload;
          return true;
        }
      } catch {
        throw new UnauthorizedException('access denied, Invalid token');
      }
    } else {
      throw new UnauthorizedException('access denied, no token provided');
    }
    return false;
  }
}
