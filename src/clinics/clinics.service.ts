import { ClinicsUsersProvider } from './clinicsUsers.provider';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDBType, JWTPayloadType } from 'src/utils/global';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { users } from 'src/database/schema/users.schema';
import { usersClinics } from 'src/database/schema/usersToClinics.schema';
import { clinics } from 'src/database/schema/clinics.schema';

@Injectable()
export class ClinicsService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDBType,
    private _clinicsUsersProvider: ClinicsUsersProvider,
  ) {}

  /**
   * Create a new clinic
   * @param payload - The JWT payload of the requesting clinic
   * @param createClinicDto - The clinic data to create
   * @returns The created clinic
   * @throws BadRequestException if clinic already exists or if non-superadmin tries to create superadmin
   */
  async create(
    payload: JWTPayloadType,
    createClinicDto: CreateClinicDto,
  ): Promise<typeof clinics.$inferSelect> {
    try {
      const { name, address, phone, email, manager, isActive } =
        createClinicDto;

      //  // Validate permissions
      //  this.validateSuperadminCreation(payload.userType, userType as UserType);

      //  // Check for existing users
      //  await this.validateUniqueUserFields(email, username);

      const [newClinic] = await this.db
        .insert(clinics)
        .values({
          name,
          address,
          phone,
          email,
          manager,
          isActive,
        })
        .returning();

      // Associate all superadmins with the new clinic
      await this._clinicsUsersProvider.onCreateClinicFindAllSuperAdminsAndInsert(
        newClinic.id,
      );

      if (!newClinic) {
        throw new BadRequestException('Failed to create clinic');
      }

      return newClinic;
    } catch (error) {
      this.handleError(error, 'Failed to create clinic');
    }
  }

  /**
   * Get all clinics from the database with pagination
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Collection of clinics with pagination info
   */
  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    clinics: (typeof clinics.$inferSelect)[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const [clinicsList, total] = await Promise.all([
        this.db.query.clinics.findMany({
          offset,
          limit,
          orderBy: [asc(clinics.id)],
        }),
        this.db
          .select({ count: sql<number>`count(*)`.as('count') }) // Explicit alias
          .from(clinics),
      ]);

      return {
        clinics: clinicsList,
        total: Number(total[0]?.count ?? 0),
        page,
        limit,
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch clinics');
    }
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
