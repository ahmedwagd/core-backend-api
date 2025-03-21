import { Inject, Injectable } from '@nestjs/common';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDBType } from 'src/utils/global';
import { and, eq, isNull } from 'drizzle-orm';
import { users } from 'src/database/schema/users.schema';
import { usersClinics } from 'src/database/schema/usersToClinics.schema';
import { clinics } from 'src/database/schema/clinics.schema';

@Injectable()
export class ClinicsService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDBType) {}
  create(createClinicDto: CreateClinicDto) {
    return `This action adds a new clinic ${createClinicDto.name}`;
  }

  findAll() {
    return `This action returns all clinics`;
  }

  findOne(id: number) {
    return `This action returns a #${id} clinic`;
  }

  update(id: number, updateClinicDto: UpdateClinicDto) {
    return `This action updates a #${id} ${updateClinicDto.name} clinic`;
  }

  remove(id: number) {
    return `This action removes a #${id} clinic`;
  }

  /**
   * Associates all superadmins with a newly created clinic by inserting records into the usersClinics table.
   * @param clinicId - The ID of the newly created clinic
   * @returns Promise<void> - Resolves when the operation is complete
   */
  private async onCreateClinicFindAllSuperAdminsAndInsert(
    clinicId: number,
  ): Promise<void> {
    // Step 1: Find all users with the 'SUPERADMIN' userType
    const superAdmins = await this.db
      .select()
      .from(users)
      .where(eq(users.userType, 'SUPERADMIN'));

    // Step 2: Prepare records to insert into usersClinics
    const insertions = superAdmins.map((superAdmin) => ({
      userId: superAdmin.id,
      clinicId: clinicId,
    }));

    // Step 3: Insert records into usersClinics if there are any superadmins
    if (insertions.length > 0) {
      await this.db.insert(usersClinics).values(insertions);
    }
  }

  /**
   * Retrieves the clinics associated with the given user ID.
   * Only includes active and non-deleted clinics.
   * @param userid - The ID of the user
   * @returns A promise that resolves to an array of clinic objects
   */
  private async findCurrentUserClinics(userid: number): Promise<any[]> {
    const result = await this.db
      .select({ clinic: clinics })
      .from(usersClinics)
      .innerJoin(clinics, eq(usersClinics.clinicId, clinics.id))
      .where(
        and(
          eq(usersClinics.userId, userid),
          isNull(clinics.deletedAt),
          eq(clinics.isActive, true),
        ),
      );

    return result.map((row) => row.clinic);
  }
}
