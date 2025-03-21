import { Inject } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDBType } from 'src/utils/global';
import { ClinicsService } from './clinics.service';
import { users } from 'src/database/schema/users.schema';
import { and, eq, isNull } from 'drizzle-orm';
import { usersClinics } from 'src/database/schema/usersToClinics.schema';
import { clinics } from 'src/database/schema/clinics.schema';

export class ClinicsUsersService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDBType,
    private _clinicsService: ClinicsService,
  ) {}

  // Todo add Documentation
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

  public async onCreateClinicFindAllSuperAdminsAndInsert(
    clinicId: number,
  ): Promise<void> {
    const superAdmins = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userType, 'SUPERADMIN'));

    const insertions = superAdmins.map((admin) => ({
      userId: admin.id,
      clinicId: clinicId,
    }));

    if (insertions.length > 0) {
      await this.db.insert(usersClinics).values(insertions);
    }
  }
}
