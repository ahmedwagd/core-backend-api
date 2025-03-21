import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { clinics } from 'src/database/schema/clinics.schema';
import { users } from 'src/database/schema/users.schema';
import { UsersService } from 'src/users/users.service';
import {
  AccessTokenType,
  DrizzleDBType,
  JWTPayloadType,
  UserType,
} from 'src/utils/global';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersToClinicsService } from 'src/users/usersToClinics.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDBType,
    private readonly _usersService: UsersService,
    private readonly _usersToClinicService: UsersToClinicsService,
    private readonly _jwtService: JwtService,
    // private readonly _mailService: MailService,
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
        const isEmailTaken = existingUsers.some((user) => user.email === email);
        const isUsernameTaken = existingUsers.some(
          (user) => user.username === username,
        );

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
      const userClinics =
        await this._usersToClinicService.getCurrentUserClinics(user.id);

      const access_token = await this.generateJWT({
        id: user.id,
        userType: user.userType as UserType,
        clinic: userClinics[0] as typeof clinics,
      });

      //  TODO: Implement email service
      // Send login notification without blocking the login process
      // await this._mailService.sendLogInEMail(user.email);
      // .catch((error) => {
      //   console.error('Failed to send login notification:', error);
      //   // Don't throw error, just log it
      // });

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
   * Logout user and invalidate access token
   * @param id The ID of the current user
   * @returns Message indicating logout success
   * @throws BadRequestException if user not found
   */
  public async logout(id: number) {
    try {
      const user = await this._usersService.findOne(id);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      return {
        message: 'Logout successful',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to logout');
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
   * Get current user details excluding sensitive information
   * @param id The ID of the current user
   * @returns User data without sensitive fields
   * @throws BadRequestException if user not found
   */
  public async getCurrentUserPayload(payload: JWTPayloadType) {
    try {
      const user = await this._usersService.findOne(payload.id);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      const userClinics =
        await this._usersToClinicService.getCurrentUserClinics(user.id);
      // Exclude sensitive information
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, resetPasswordToken, ...userInfo } = user;

      return {
        ...userInfo,
        isActive: !user.deletedAt,
        userClinics,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch current user');
    }
  }

  // change password add try catch
  public async changePassword(
    id: number,
    changePasswordDto: ChangePasswordDto,
  ) {
    try {
      const { oldPassword, newPassword } = changePasswordDto;
      const user = await this._usersService.findOne(id);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid old password');
      }

      const hashedPassword = await this._usersService.hashPassword(newPassword);
      await this.db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, id));
      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to change password');
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
