import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { users } from 'src/database/schema/users.schema';
import { usersClinics } from 'src/database/schema/usersToClinics.schema';
import { DrizzleDBType, UserType } from 'src/utils/global';
import { ClinicsService } from './clinics.service';
@Injectable()
export class ClinicsUsersProvider {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDBType,
    @Inject(forwardRef(() => ClinicsService))
    private _clinicsService: ClinicsService,
  ) {}

  /**
   * Associates all superadmins with a newly created clinic by inserting records into the usersClinics table.
   * @param clinicId - The ID of the newly created clinic
   * @returns Promise<void> - Resolves when the operation is complete
   */
  public async associateClinicWithAllSuperadmins(
    clinicId: number,
  ): Promise<void> {
    console.log(`Associating clinic ${clinicId} with all superadmins...`);

    try {
      // Get all superadmin users
      const superAdmins = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.userType, UserType.SUPERADMIN));

      if (superAdmins.length === 0) {
        return;
      }

      // Retrieve existing associations for this clinic
      const existingAssociations = await this.db
        .select({ userId: usersClinics.userId })
        .from(usersClinics)
        .where(eq(usersClinics.clinicId, clinicId));

      // Create a Set of existing userIds to prevent duplicates
      const existingUserIds = new Set(
        existingAssociations.map((assoc) => assoc.userId),
      );

      // Filter superadmins to only include those NOT already associated
      const newAssociations = superAdmins
        .filter((admin) => !existingUserIds.has(admin.id)) // Avoid duplicates
        .map((admin) => ({
          userId: admin.id,
          clinicId: clinicId,
        }));

      if (newAssociations.length > 0) {
        await this.db.insert(usersClinics).values(newAssociations);
        console.log('Successfully associated clinic with superadmins.');
      }
    } catch (error) {
      console.error('Error in associateClinicWithAllSuperadmins:', error);
    }
  }
}
