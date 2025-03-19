import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { users } from 'src/database/schema/users.schema';
import { DrizzleDBType, UserType } from 'src/utils/global';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDBType) {}

  /**
   * Get all users from the database
   * @returns collection of users
   */
  async getAll(): Promise<(typeof users.$inferSelect)[]> {
    try {
      return this.db.query.users.findMany({
        orderBy: [asc(users.id)],
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to fetch users');
    }
  }

  async create(createUserDto: CreateUserDto): Promise<typeof users.$inferSelect> {
    try {
      const { email, password, username, userType, isVerified } = createUserDto;

      const userEmailFromDb = await this.db.query.users.findFirst({
        where: eq(users.email, email),
      });
      const userUsernameFromDb = await this.db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (userEmailFromDb || userUsernameFromDb)
        throw new BadRequestException('user already exist');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const [newUser] = await this.db
        .insert(users)
        .values({
          email,
          username,
          userType: userType as UserType,
          isVerified,
          password: hashedPassword,
        })
        .returning();

      return newUser;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to create user');
    }
  }

  public async findOne(id: number): Promise<typeof users.$inferSelect> {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) throw new BadRequestException('no users for this email');
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to fetch user');
    }
  }

  public async findByEmail(email: string): Promise<typeof users.$inferSelect> {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) throw new BadRequestException('no users for this email');
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to fetch user');
    }
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
