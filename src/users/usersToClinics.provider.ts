import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { clinics } from 'src/database/schema/clinics.schema';
import { usersClinics } from 'src/database/schema/usersToClinics.schema';
import { DrizzleDBType } from 'src/utils/global';
import { UsersService } from './users.service';

@Injectable()
export class UsersToClinicsProvider {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDBType,
    @Inject(forwardRef(() => UsersService))
    private _usersService: UsersService,
  ) {}

  // Todo - change clinics
  // public async changeClinics(payload: JWTPayloadType, clinicId: number) {}

  /**
   * Retrieves the data of the clinic associated with the given user ID.
   * Returns null if no active clinic is associated with the user.
   * @param userId - The ID of the user whose clinic data is to be retrieved
   * @returns A promise that resolves to the clinic data or null
   */
  public async retrieveCurrentClinicData(userId: number): Promise<any> {
    // Query to get clinic data through the usersClinics relationship
    const result = await this.db
      .select({ clinic: clinics })
      .from(usersClinics)
      .innerJoin(clinics, eq(usersClinics.clinicId, clinics.id))
      .where(
        and(
          eq(usersClinics.userId, userId),
          isNull(clinics.deletedAt),
          eq(clinics.isActive, true),
        ),
      )
      .limit(1);

    // If no result is found, return null
    if (result.length === 0) {
      return null;
    }

    // Return the clinic data
    return result[0].clinic;
  }

  /**
   * Associates a newly created superadmin user with all active clinics.
   * This function should be called after a superadmin user is created.
   * @param superAdminId - The ID of the newly created superadmin user
   * @returns Promise<void> - Resolves when the operation is complete
   */

  public async onCreateSuperAdminAssociateWithAllClinics(
    superAdminId: number,
  ): Promise<void> {
    const activeClinics = await this.db
      .select({ id: clinics.id })
      .from(clinics)
      .where(and(isNull(clinics.deletedAt), eq(clinics.isActive, true)));

    const insertions = activeClinics.map((clinic) => ({
      userId: superAdminId,
      clinicId: clinic.id,
    }));

    if (insertions.length > 0) {
      await this.db.insert(usersClinics).values(insertions);
    }
  }
}
