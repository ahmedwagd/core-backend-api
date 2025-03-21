import { clinics } from './../database/schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema/schema';

export type DrizzleDBType = NodePgDatabase<typeof schema>;

export type JWTPayloadType = {
  id: number;
  userType: UserType;
  clinic?: typeof clinics;
};

export type AccessTokenType = {
  access_token: string;
};

export enum UserType {
  SUPERADMIN = 'SUPERADMIN',
  MANAGER = 'MANAGER',
  DOCTOR = 'DOCTOR',
  USER = 'USER',
}
