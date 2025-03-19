import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../utils/global';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
