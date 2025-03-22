// src/profiles/profiles.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/user-role.decorator';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { JWTPayloadType, UserType } from '../utils/global';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  async create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  @Get('user/:userId')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.profilesService.findByUserId(userId);
  }

  @Patch('user/:userId')
  @Roles(UserType.SUPERADMIN, UserType.MANAGER)
  @UseGuards(AuthRolesGuard)
  async update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(userId, updateProfileDto);
  }

  // You might also want to add an endpoint for the current user's profile
  @Get('my-profile')
  @UseGuards(AuthRolesGuard)
  async getMyProfile(@CurrentUser() payload: JWTPayloadType) {
    return this.profilesService.findByUserId(payload.id);
  }

  @Patch('my-profile')
  @UseGuards(AuthRolesGuard)
  async updateMyProfile(
    @CurrentUser() payload: JWTPayloadType,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(payload.id, updateProfileDto);
  }
}
