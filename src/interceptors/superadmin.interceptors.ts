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
import { clinics } from 'src/database/schema/clinics.schema';
import { usersClinics } from 'src/database/schema/usersToClinics.schema';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class SuperadminAssociationInterceptor implements NestInterceptor {
  constructor(@Inject(DRIZZLE) private db: DrizzleDBType) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Execute the route handler
    return next.handle().pipe(
      tap(async (data) => {
        // Check if this is a user creation response and the user is a superadmin
        if (data && data.userType === UserType.SUPERADMIN) {
          await this.associateSuperadminWithAllClinics(data.id);
        }
      }),
    );
  }

  /**
   * Associates a superadmin with all active clinics
   * This is extracted from the provider to break circular dependencies
   */
  private async associateSuperadminWithAllClinics(
    superAdminId: number,
  ): Promise<void> {
    try {
      // Find all active and non-deleted clinics
      const activeClinics = await this.db
        .select({ id: clinics.id })
        .from(clinics)
        .where(and(isNull(clinics.deletedAt), eq(clinics.isActive, true)));

      // Prepare records to insert into usersClinics junction table
      const insertions = activeClinics.map((clinic) => ({
        userId: superAdminId,
        clinicId: clinic.id,
      }));

      // Insert records into usersClinics if there are any active clinics
      if (insertions.length > 0) {
        await this.db.insert(usersClinics).values(insertions);
      }
    } catch (error) {
      console.error('Failed to associate superadmin with clinics:', error);
      // We don't throw here to avoid affecting the response
      // But you could add a notification system to alert admins
    }
  }
}
