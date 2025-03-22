import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { profiles } from 'src/database/schema/profiles.schema';
import { DrizzleDBType } from 'src/utils/global';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDBType) {}

  async create(
    createProfileDto: CreateProfileDto,
  ): Promise<typeof profiles.$inferSelect> {
    try {
      // Check if profile already exists for user
      const existingProfile = await this.db.query.profiles.findFirst({
        where: eq(profiles.userId, createProfileDto.userId),
      });

      if (existingProfile) {
        throw new BadRequestException('Profile already exists for this user');
      }

      // Create profile
      const [newProfile] = await this.db
        .insert(profiles)
        .values(createProfileDto)
        .returning();

      if (!newProfile) {
        throw new BadRequestException('Failed to create profile');
      }

      return newProfile;
    } catch (error) {
      this.handleError(error, 'Failed to create profile');
    }
  }

  async findByUserId(id: number): Promise<typeof profiles.$inferSelect> {
    try {
      const profile = await this.db.query.profiles.findFirst({
        where: eq(profiles.userId, id),
      });

      if (!profile) {
        throw new BadRequestException('Profile not found');
      }

      return profile;
    } catch (error) {
      this.handleError(error, 'Failed to fetch profile');
    }
  }

  async update(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<typeof profiles.$inferSelect> {
    try {
      // Find profile by userId
      const profile = await this.findByUserId(userId);

      // Update profile
      const [updatedProfile] = await this.db
        .update(profiles)
        .set(updateProfileDto)
        .where(eq(profiles.id, profile.id))
        .returning();

      if (!updatedProfile) {
        throw new BadRequestException('Failed to update profile');
      }

      return updatedProfile;
    } catch (error) {
      this.handleError(error, 'Failed to update profile');
    }
  }

  private handleError(error: unknown, defaultMessage: string): never {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(defaultMessage);
  }
}
