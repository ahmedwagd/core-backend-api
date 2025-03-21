import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { Roles } from 'src/auth/decorators/user-role.decorator';
import { JWTPayloadType, UserType } from 'src/utils/global';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @Roles(UserType.SUPERADMIN)
  @UseGuards(AuthRolesGuard)
  async create(
    @CurrentUser() payload: JWTPayloadType,
    @Body() createClinicDto: CreateClinicDto,
  ) {
    return await this.clinicsService.create(payload, createClinicDto);
  }

  @Get()
  @Roles(UserType.SUPERADMIN)
  @UseGuards(AuthRolesGuard)
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserType.SUPERADMIN)
  @UseGuards(AuthRolesGuard)
  update(
    @CurrentUser() payload: JWTPayloadType,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClinicDto: UpdateClinicDto,
  ) {
    return this.clinicsService.update(payload, id, updateClinicDto);
  }

  @Delete(':id')
  @Roles(UserType.SUPERADMIN)
  @UseGuards(AuthRolesGuard)
  remove(
    @CurrentUser() payload: JWTPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clinicsService.remove(payload, id);
  }
}
