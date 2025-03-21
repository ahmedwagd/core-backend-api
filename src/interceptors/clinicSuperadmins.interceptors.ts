/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDBType, UserType } from 'src/utils/global';
import { users } from 'src/database/schema/users.schema';
import { usersClinics } from 'src/database/schema/usersToClinics.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ClinicSuperadminsAssociationInterceptor
  implements NestInterceptor
{
  constructor(@Inject(DRIZZLE) private db: DrizzleDBType) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async (data) => {
        if (data && data.id) {
          await this.associateClinicWithAllSuperadmins(data.id);
        }
      }),
    );
  }

  /**
   * Associates a newly created clinic with all superadmins
   * after checking for existing associations.
   */
  private async associateClinicWithAllSuperadmins(
    clinicId: number,
  ): Promise<void> {
    try {
      // Get all superadmin users
      const superAdmins = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.userType, UserType.SUPERADMIN));

      // Retrieve existing associations for this clinic
      const existingAssociations = await this.db
        .select({ userId: usersClinics.userId })
        .from(usersClinics)
        .where(eq(usersClinics.clinicId, clinicId));

      const existingUserIds = new Set(
        existingAssociations.map((assoc) => assoc.userId),
      );

      // Filter out superadmins already associated with the clinic
      const newAssociations = superAdmins
        .filter((admin) => !existingUserIds.has(admin.id))
        .map((admin) => ({
          userId: admin.id,
          clinicId: clinicId,
        }));

      if (newAssociations.length > 0) {
        await this.db.insert(usersClinics).values(newAssociations);
      }
    } catch (error) {
      console.error('Failed to associate clinic with superadmins:', error);
      // Prevent the error from affecting the response
    }
  }
}
