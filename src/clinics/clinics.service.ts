import { Inject, Injectable } from '@nestjs/common';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDBType } from 'src/utils/global';

@Injectable()
export class ClinicsService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDBType) {}
  create(createClinicDto: CreateClinicDto) {
    return 'This action adds a new clinic';
  }

  findAll() {
    return `This action returns all clinics`;
  }

  findOne(id: number) {
    return `This action returns a #${id} clinic`;
  }

  update(id: number, updateClinicDto: UpdateClinicDto) {
    return `This action updates a #${id} clinic`;
  }

  remove(id: number) {
    return `This action removes a #${id} clinic`;
  }
}
