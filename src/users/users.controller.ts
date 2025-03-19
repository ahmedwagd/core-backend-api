import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/user-role.decorator';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { UserType } from '../utils/global';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}

  @Post('create')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    return await this._usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  findAll() {
    return this._usersService.getAll();
  }

  @Get(':id')
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return this._usersService.findOne(id);
  }

  @Get('email')
  findOneByEmail(@Query('email') email: string) {
    return this._usersService.findByEmail(email);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this._usersService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this._usersService.remove(+id);
  // }
}
