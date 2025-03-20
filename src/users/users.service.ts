/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { asc, eq, or, sql } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { users } from 'src/database/schema/users.schema';
import { DrizzleDBType, JWTPayloadType, UserType } from 'src/utils/global';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDBType) {}

  /**
   * Get all users from the database with pagination
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Collection of users with pagination info
   */
  async getAll(
    page = 1,
    limit = 10,
  ): Promise<{
    users: (typeof users.$inferSelect)[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const [usersList, total] = await Promise.all([
        this.db.query.users.findMany({
          offset,
          limit,
          orderBy: [asc(users.id)],
        }),
        this.db.select({ count: sql<number>`count(*)` }).from(users),
      ]);

      return {
        users: usersList,
        total: Number(total[0].count),
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to fetch users');
    }
  }

  /**
   * Create a new user
   * @param payload - The JWT payload of the requesting user
   * @param createUserDto - The user data to create
   * @returns The created user
   * @throws BadRequestException if user already exists or if non-superadmin tries to create superadmin
   */
  async create(
    payload: JWTPayloadType,
    createUserDto: CreateUserDto,
  ): Promise<typeof users.$inferSelect> {
    try {
      const { email, password, username, userType, isVerified } = createUserDto;

      // Check if non-superadmin is trying to create a superadmin
      if (
        payload.userType !== UserType.SUPERADMIN &&
        userType === UserType.SUPERADMIN
      ) {
        throw new BadRequestException(
          'Only superadmins can create other superadmins',
        );
      }

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

      // Hash password and create user
      const hashedPassword = await this.hashPassword(password);
      const [newUser] = await this.db
        .insert(users)
        .values({
          email,
          username,
          userType: userType as UserType,
          isVerified,
          password: hashedPassword,
        })
        .returning();

      if (!newUser) {
        throw new BadRequestException('Failed to create user');
      }

      return newUser;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Find a user by their ID
   * @param id - The ID of the user to find
   * @returns The found user
   * @throws BadRequestException if no user is found
   */
  public async findOne(id: number): Promise<typeof users.$inferSelect> {
    try {
      const user = await this.db.query.users.findFirst({
        // where: eq(users.id, id),
        where: (user, { eq }) => eq(user.id, id),
      });

      if (!user) throw new BadRequestException('no users for this email');
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to fetch user');
    }
  }

  /**
   * Find a user by their email
   * @param email - The email of the user to find
   * @returns The found user
   * @throws BadRequestException if no user is found
   */
  public async findByEmail(email: string): Promise<typeof users.$inferSelect> {
    try {
      const user = await this.db.query.users.findFirst({
        where: (user, { eq }) => eq(user.email, email),
      });

      if (!user) throw new BadRequestException('no users for this email');
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to fetch user');
    }
  }

  /**
   * Update a user's information
   * @param payload - The JWT payload of the requesting user
   * @param id - The ID of the user to update
   * @param updateUserDto - The updated user data
   * @returns The updated user
   * @throws BadRequestException if user not found or if non-superadmin tries to update superadmin
   */
  public async update(
    payload: JWTPayloadType,
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<typeof users.$inferSelect> {
    try {
      const user = await this.findOne(id);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const { password, email, username, userType } = updateUserDto;

      // Check if non-superadmin is trying to update a superadmin
      if (
        user.userType === UserType.SUPERADMIN &&
        payload.userType !== UserType.SUPERADMIN
      ) {
        throw new BadRequestException(
          'Only superadmins can update other superadmins',
        );
      }

      // Check if non-superadmin is trying to set userType to superadmin
      if (
        userType === UserType.SUPERADMIN &&
        payload.userType !== UserType.SUPERADMIN
      ) {
        throw new BadRequestException(
          'Only superadmins can set user type to superadmin',
        );
      }

      // Check for existing users in a single query
      const existingUsers = await this.db.query.users.findMany({
        where: or(eq(users.email, email), eq(users.username, username)),
      });

      if (existingUsers.length > 0) {
        const isEmailTaken = existingUsers.some(
          (user) => user.email === email && user.id !== id,
        );
        const isUsernameTaken = existingUsers.some(
          (user) => user.username === username && user.id !== id,
        );

        if (isEmailTaken) {
          throw new BadRequestException('Email already registered');
        }
        if (isUsernameTaken) {
          throw new BadRequestException('Username already taken');
        }
      }

      // Hash password if provided
      if (password) {
        updateUserDto.password = await this.hashPassword(password);
      }

      // Update user
      const [updatedUser] = await this.db
        .update(users)
        .set({
          ...updateUserDto,
          userType: userType as UserType,
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new BadRequestException('Failed to update user');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Remove a user by their ID
   * @param id - The ID of the user to remove
   * @returns A message indicating the user was deleted
   * @throws BadRequestException if no user is found or if the user is a superadmin
   */
  async remove(payload: JWTPayloadType, id: number) {
    try {
      const user = await this.findOne(id);
      if (!user) throw new BadRequestException('no user found');

      // check if id is for superadmin and payload is not superadmin
      if (
        user.userType === UserType.SUPERADMIN &&
        payload.userType !== UserType.SUPERADMIN
      ) {
        throw new BadRequestException('cannot delete superadmin');
      }

      await this.db.delete(users).where(eq(users.id, id)).execute();

      return { message: 'user deleted' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Hash a password
   * @param password - The password to hash
   * @returns The hashed password
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }
}
