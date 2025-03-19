import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request } from 'express';
import { JWTPayloadType } from 'src/utils/global';
import { CURRENT_USER_KEY } from 'src/utils/constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
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
        req[CURRENT_USER_KEY] = payload;
      } catch {
        throw new UnauthorizedException('access denied, Invalid token');
      }
    } else {
      throw new UnauthorizedException('access denied, no token provided');
    }
    return true;
  }
}
