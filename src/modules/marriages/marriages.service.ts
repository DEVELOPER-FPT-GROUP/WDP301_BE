import { Injectable } from '@nestjs/common';
import { CreateMarriageDto } from './dto/create-marriage.dto';
import { UpdateMarriageDto } from './dto/update-marriage.dto';

@Injectable()
export class MarriagesService {
  create(createMarriageDto: CreateMarriageDto) {
    return 'This action adds a new marriage';
  }

  findAll() {
    return `This action returns all marriages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} marriage`;
  }

  update(id: number, updateMarriageDto: UpdateMarriageDto) {
    return `This action updates a #${id} marriage`;
  }

  remove(id: number) {
    return `This action removes a #${id} marriage`;
  }
}
