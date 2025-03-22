import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { asc, eq, or, sql } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { users } from 'src/database/schema/users.schema';
import { DrizzleDBType, JWTPayloadType, UserType } from 'src/utils/global';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersToClinicsProvider } from './usersToClinics.provider';
import { ProfilesService } from 'src/profiles/profiles.service';
import { CreateUserWithProfileDto } from './dto/create-user-with-profile.dto';
import { profiles } from 'src/database/schema/profiles.schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDBType,
    @Inject(forwardRef(() => UsersToClinicsProvider))
    private _usersToClinicsProvider: UsersToClinicsProvider,
    @Inject(forwardRef(() => ProfilesService))
    private _profilesService: ProfilesService,
  ) {}

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
          with: {
            clinics: true,
          },
        }),
        this.db
          .select({ count: sql<number>`count(*)`.as('count') }) // Explicit alias
          .from(users),
      ]);

      return {
        users: usersList,
        total: Number(total[0]?.count ?? 0),
        page,
        limit,
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch users');
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

      // Validate permissions
      this.validateSuperadminCreation(payload.userType, userType as UserType);

      // Check for existing users
      await this.validateUniqueUserFields(email, username);

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

      // If the new user is a superadmin, associate with all clinics
      if (newUser.userType === UserType.SUPERADMIN) {
        await this._usersToClinicsProvider.onCreateSuperAdminAssociateWithAllClinics(
          newUser.id,
        );
      }

      return newUser;
    } catch (error) {
      this.handleError(error, 'Failed to create user');
    }
  }

  async createUserWithProfile(
    payload: JWTPayloadType,
    createUserDto: CreateUserWithProfileDto,
  ): Promise<{
    user: typeof users.$inferSelect;
    profile?: typeof profiles.$inferSelect;
  }> {
    try {
      const { email, password, username, userType, isVerified, profile } =
        createUserDto;

      // Validate permissions
      this.validateSuperadminCreation(payload.userType, userType as UserType);

      // Check for existing users
      await this.validateUniqueUserFields(email, username);

      // Start a transaction to ensure both user and profile are created or neither is
      return await this.db.transaction(async (tx) => {
        // Hash password and create user
        const hashedPassword = await this.hashPassword(password);
        const [newUser] = await tx
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

        // If the new user is a superadmin, associate with all clinics
        if (newUser.userType === UserType.SUPERADMIN) {
          await this._usersToClinicsProvider.onCreateSuperAdminAssociateWithAllClinics(
            newUser.id,
          );
        }

        // Create profile if provided
        let userProfile;
        if (profile) {
          const profileData = {
            ...profile,
            userId: newUser.id,
          };

          const [newProfile] = await tx
            .insert(profiles)
            .values(profileData)
            .returning();

          if (!newProfile) {
            throw new BadRequestException('Failed to create profile');
          }

          userProfile = newProfile;
        }

        return {
          user: newUser,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          profile: userProfile,
        };
      });
    } catch (error) {
      this.handleError(error, 'Failed to create user');
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
        where: (user, { eq }) => eq(user.id, id),
      });

      if (!user) throw new BadRequestException('User not found');
      return user;
    } catch (error) {
      this.handleError(error, 'Failed to fetch user');
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

      if (!user) throw new BadRequestException('No user found with this email');
      return user;
    } catch (error) {
      this.handleError(error, 'Failed to fetch user');
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
      // No need to check if user exists as findOne already throws if not found

      const { password, email, username, userType } = updateUserDto;

      // Validate all permissions
      this.validateSuperadminModification(
        user,
        payload.userType,
        userType as UserType,
      );

      // Check for email/username conflicts
      if (email || username) {
        await this.validateUniqueUserFieldsForUpdate(id, email, username);
      }

      // Process update data
      const updateData = { ...updateUserDto };

      // Hash password if provided
      if (password) {
        updateData.password = await this.hashPassword(password);
      }

      // Update user
      const [updatedUser] = await this.db
        .update(users)
        .set({
          ...updateData,
          userType: userType as UserType,
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new BadRequestException('Failed to update user');
      }

      return updatedUser;
    } catch (error) {
      this.handleError(error, 'Failed to update user');
    }
  }

  /**
   * Remove a user by their ID
   * @param payload - The JWT payload of the requesting user
   * @param id - The ID of the user to remove
   * @returns A message indicating the user was deleted
   * @throws BadRequestException if no user is found or if the user is a superadmin
   */
  async remove(payload: JWTPayloadType, id: number) {
    try {
      const user = await this.findOne(id);
      // No need to check if user exists as findOne already throws if not found

      // Validate superadmin permissions
      this.validateSuperadminDeletion(user, payload.userType);

      await this.db.delete(users).where(eq(users.id, id)).execute();

      return { message: 'User deleted successfully' };
    } catch (error) {
      this.handleError(error, 'Failed to delete user');
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

  /**
   * Validates if a non-superadmin is trying to create a superadmin
   * @private
   */
  private validateSuperadminCreation(
    creatorType: UserType,
    newUserType?: UserType,
  ): void {
    if (
      creatorType !== UserType.SUPERADMIN &&
      newUserType === UserType.SUPERADMIN
    ) {
      throw new BadRequestException(
        'Only superadmins can create other superadmins',
      );
    }
  }

  /**
   * Validates if a non-superadmin is trying to update or change role of a superadmin
   * @private
   */
  private validateSuperadminModification(
    targetUser: typeof users.$inferSelect,
    modifierType: UserType,
    newUserType?: UserType,
  ): void {
    // Check if non-superadmin is trying to update a superadmin
    if (
      targetUser.userType === UserType.SUPERADMIN &&
      modifierType !== UserType.SUPERADMIN
    ) {
      throw new BadRequestException(
        'Only superadmins can update other superadmins',
      );
    }

    // Check if non-superadmin is trying to set userType to superadmin
    if (
      newUserType === UserType.SUPERADMIN &&
      modifierType !== UserType.SUPERADMIN
    ) {
      throw new BadRequestException(
        'Only superadmins can set user type to superadmin',
      );
    }
  }

  /**
   * Validates if a non-superadmin is trying to delete a superadmin
   * @private
   */
  private validateSuperadminDeletion(
    user: typeof users.$inferSelect,
    deleterType: UserType,
  ): void {
    if (
      user.userType === UserType.SUPERADMIN &&
      deleterType !== UserType.SUPERADMIN
    ) {
      throw new BadRequestException(
        'Only superadmins can delete other superadmins',
      );
    }
  }

  /**
   * Validates that email and username are unique
   * @private
   */
  private async validateUniqueUserFields(
    email?: string,
    username?: string,
  ): Promise<void> {
    if (!email && !username) return;

    const existingUsers = await this.db.query.users.findMany({
      where: or(
        ...(email ? [eq(users.email, email)] : []),
        ...(username ? [eq(users.username, username)] : []),
      ),
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
  }

  /**
   * Validates that email and username are unique for updates (excluding current user)
   * @private
   */
  private async validateUniqueUserFieldsForUpdate(
    userId: number,
    email?: string,
    username?: string,
  ): Promise<void> {
    if (!email && !username) return;

    const existingUsers = await this.db.query.users.findMany({
      where: or(
        ...(email ? [eq(users.email, email)] : []),
        ...(username ? [eq(users.username, username)] : []),
      ),
    });

    if (existingUsers.length > 0) {
      const isEmailTaken = existingUsers.some(
        (user) => user.email === email && user.id !== userId,
      );
      const isUsernameTaken = existingUsers.some(
        (user) => user.username === username && user.id !== userId,
      );

      if (isEmailTaken) {
        throw new BadRequestException('Email already registered');
      }
      if (isUsernameTaken) {
        throw new BadRequestException('Username already taken');
      }
    }
  }

  /**
   * Centralized error handling
   * @private
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(defaultMessage);
  }
}
