import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request } from 'express';
import { CURRENT_USER_KEY } from '../../utils/constants';
import { JWTPayloadType } from '../../utils/global';

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext): JWTPayloadType => {
    const request: Request = context.switchToHttp().getRequest();
    const payload = request[CURRENT_USER_KEY];
    if (!payload) throw new UnauthorizedException('User not found');
    return payload as JWTPayloadType;
  },
);
