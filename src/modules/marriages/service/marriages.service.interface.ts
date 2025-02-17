import { MarriageDTO } from '../dto/response/marriage.dto';
import { CreateMarriageDto } from '../dto/request/create-marriage.dto';
import { UpdateMarriageDto } from '../dto/request/update-marriage.dto';

export interface IMarriagesService {
  createMarriage(createMarriageDto: CreateMarriageDto): Promise<MarriageDTO>;
  findAllMarriages(): Promise<MarriageDTO[]>;
  getMarriageById(id: string): Promise<MarriageDTO>;
  updateMarriage(id: string, updateData: Partial<UpdateMarriageDto  >): Promise<MarriageDTO>;
  deleteMarriage(id: string): Promise<boolean>;
  getSpouse(memberId: string): Promise<MarriageDTO>
  getAllSpouses(memberIds: string[]): Promise<MarriageDTO[]>
}
