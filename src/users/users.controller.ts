import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/user-role.decorator';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { JWTPayloadType, UserType } from '../utils/global';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}

  @Post('create')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  async create(
    @CurrentUser() payload: JWTPayloadType,
    @Body() createUserDto: CreateUserDto,
  ) {
    return await this._usersService.create(payload, createUserDto);
  }

  @Get()
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  findAll() {
    return this._usersService.getAll();
  }

  @Get(':id')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return this._usersService.findOne(id);
  }

  @Get('email')
  async findOneByEmail(@Query('email') email: string) {
    return this._usersService.findByEmail(email);
  }

  @Patch(':id')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  async update(
    @CurrentUser() payload: JWTPayloadType,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this._usersService.update(payload, id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  remove(
    @CurrentUser() payload: JWTPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this._usersService.remove(payload, id);
  }
}
