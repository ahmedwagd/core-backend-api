import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { users } from 'src/database/schema/users.schema';
import { UsersService } from 'src/users/users.service';
import {
  AccessTokenType,
  DrizzleDBType,
  JWTPayloadType,
  UserType,
} from 'src/utils/global';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDBType,
    private readonly _usersService: UsersService,
    private readonly _jwtService: JwtService,
  ) {}

  /**
   * Register a new user and generate access token
   * @param registerDto Registration data (email, password, username)
   * @returns Access token for the new user
   * @throws BadRequestException if user already exists
   */
  public async register(registerDto: RegisterDto): Promise<AccessTokenType> {
    try {
      const { email, password, username } = registerDto;

      // Check for existing users in a single query
      const existingUsers = await this.db.query.users.findMany({
        where: or(eq(users.email, email), eq(users.username, username)),
      });

      if (existingUsers.length > 0) {
        const isEmailTaken = existingUsers.some(user => user.email === email);
        const isUsernameTaken = existingUsers.some(user => user.username === username);
        
        if (isEmailTaken) {
          throw new BadRequestException('Email already registered');
        }
        if (isUsernameTaken) {
          throw new BadRequestException('Username already taken');
        }
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const [insertedUser] = await this.db
        .insert(users)
        .values({
          email,
          username,
          password: hashedPassword,
          isVerified: false,
          userType: 'USER' as UserType,
        })
        .returning();

      if (!insertedUser) {
        throw new BadRequestException('Failed to create user');
      }

      // Generate access token
      const access_token = await this.generateJWT({
        id: insertedUser.id,
        userType: insertedUser.userType as UserType,
      });
      return {
        access_token,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }

  /**
   * Authenticate user and generate access token
   * @param loginDto Login credentials (email and password)
   * @returns Access token for authenticated user
   * @throws BadRequestException if credentials are invalid
   */
  public async login(loginDto: LoginDto): Promise<AccessTokenType> {
    try {
      const { email, password } = loginDto;

      const user = await this._usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid email or password');
      }

      if (!user.isVerified) {
        throw new BadRequestException('Please verify your email first');
      }

      if (user.deletedAt) {
        throw new BadRequestException('Account is deactivated');
      }

      const access_token = await this.generateJWT({
        id: user.id,
        userType: user.userType as UserType,
      });

      return {
        access_token,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }

  /**
   * Get current user details excluding sensitive information
   * @param id The ID of the current user
   * @returns User data without sensitive fields
   * @throws BadRequestException if user not found
   */
  public async getCurrentUser(id: number) {
    try {
      const user = await this._usersService.findOne(id);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      
      // Exclude sensitive information
      const { password, resetPasswordToken, ...userInfo } = user;
      
      return {
        ...userInfo,
        isActive: !user.deletedAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch current user');
    }
  }

  /**
   * Generate Json Web Token
   * @param payload JWT payload
   * @returns token
   */
  private async generateJWT(payload: JWTPayloadType): Promise<string> {
    return await this._jwtService.signAsync(payload);
  }
}
