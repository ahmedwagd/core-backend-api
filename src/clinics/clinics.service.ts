import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { asc, eq, or, sql } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { clinics } from 'src/database/schema/clinics.schema';
import { DrizzleDBType, JWTPayloadType, UserType } from 'src/utils/global';
import { ClinicsUsersProvider } from './clinicsUsers.provider';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

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
  async create(payload: JWTPayloadType, createClinicDto: CreateClinicDto) {
    try {
      const { name, address, phone, email, manager, isActive } =
        createClinicDto;

      // Validate permissions
      this.validateClinicCreation(payload.userType);

      // Check for Validate unique fields before creating the clinic
      await this.validateUniqueClinicFields(name, address, phone, email);

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
        .returning({ id: clinics.id });

      if (!newClinic || !newClinic.id) {
        throw new BadRequestException(
          'Failed to create clinic: No ID returned',
        );
      }
      // Associate all superadmins with the new clinic
      await this._clinicsUsersProvider.associateClinicWithAllSuperadmins(
        newClinic.id,
      );

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
   * Validates that the clinic does not already exist
   * by checking name, address, phone, and email.
   */
  private async validateUniqueClinicFields(
    name?: string,
    address?: string,
    phone?: string,
    email?: string,
  ): Promise<void> {
    if (!name && !address && !phone && !email) return;

    // Query for existing clinics based on provided fields
    const existingClinics = await this.db.query.clinics.findMany({
      where: or(
        ...(name ? [eq(clinics.name, name)] : []),
        ...(address ? [eq(clinics.address, address)] : []),
        ...(phone ? [eq(clinics.phone, phone)] : []),
        ...(email ? [eq(clinics.email, email)] : []),
      ),
    });

    if (existingClinics.length > 0) {
      const isNameTaken = existingClinics.some(
        (clinic) => clinic.name === name,
      );
      const isAddressTaken = existingClinics.some(
        (clinic) => clinic.address === address,
      );
      const isPhoneTaken = existingClinics.some(
        (clinic) => clinic.phone === phone,
      );
      const isEmailTaken = existingClinics.some(
        (clinic) => clinic.email === email,
      );

      if (isNameTaken) {
        throw new BadRequestException('Clinic name already exists');
      }
      if (isAddressTaken) {
        throw new BadRequestException('Clinic address already exists');
      }
      if (isPhoneTaken) {
        throw new BadRequestException('Clinic phone number already exists');
      }
      if (isEmailTaken) {
        throw new BadRequestException('Clinic email already exists');
      }
    }
  }

  /**
   * Validates if a user has permission to create a clinic
   * @param userType The user type of the requester
   */
  private validateClinicCreation(userType: UserType): void {
    if (userType !== UserType.SUPERADMIN) {
      throw new BadRequestException('Only superadmins can create clinics');
    }
  }

  /**
   * Validates if a user has permission to modify a clinic
   * @param userType The user type of the requester
   */
  private validateClinicModification(userType: UserType): void {
    if (userType !== UserType.SUPERADMIN) {
      throw new BadRequestException('Only superadmins can modify clinics');
    }
  }

  /**
   * Validates if a user has permission to delete a clinic
   * @param userType The user type of the requester
   */
  private validateClinicDeletion(userType: UserType): void {
    if (userType !== UserType.SUPERADMIN) {
      throw new BadRequestException('Only superadmins can delete clinics');
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
