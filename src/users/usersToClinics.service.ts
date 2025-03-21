import { Inject } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { clinics } from 'src/database/schema/clinics.schema';
import { usersClinics } from 'src/database/schema/usersToClinics.schema';
import { DrizzleDBType } from 'src/utils/global';
import { UsersService } from './users.service';

export class UsersToClinicsService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDBType,
    private _usersService: UsersService,
  ) {}

  // Todo - change clinics
  // public async changeClinics(payload: JWTPayloadType, clinicId: number) {}

  // get current clinics for user add return type
  public async getCurrentUserClinics(userId: number): Promise<any[]> {
    const clinicRecords = await this.db
      .select({
        id: clinics.id,
        name: clinics.name,
        // Add other clinic fields as needed
      })
      .from(usersClinics)
      .innerJoin(clinics, eq(clinics.id, usersClinics.clinicId))
      .where(eq(usersClinics.userId, userId));

    return clinicRecords.map((record) => ({
      id: record.id,
      name: record.name,
    }));

    // const result = await this.db
    //   .select({ clinic: clinics })
    //   .from(usersClinics)
    //   .innerJoin(clinics, eq(usersClinics.clinicId, clinics.id))
    //   .where(
    //     and(
    //       eq(usersClinics.userId, userId),
    //       isNull(clinics.deletedAt),
    //       eq(clinics.isActive, true),
    //     ),
    //   );

    // return result.map((row) => row.clinic);
  }

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
}
