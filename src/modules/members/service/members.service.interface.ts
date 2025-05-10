import { MemberDTO } from '../dto/response/member.dto';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { UpdateMemberDto } from '../dto/request/update-member.dto';
import { CreateSpouseDto } from '../dto/request/create-spouse.dto';
import { CreateChildDto } from '../dto/request/create-child.dto';
import { Promise } from 'mongoose';
import { SearchMemberDto } from '../dto/request/search-member.dto';
import { PaginationDTO } from '../../../utils/pagination.dto';
import { SearchAccountDto } from '../../accounts/dto/request/search-account.dto';
import { AccountResponseDto } from '../../accounts/dto/response/account.dto';
import { MulterFile } from '../../../common/types/multer-file.type';

export interface IMembersService {
  createMember(createMemberDto: CreateMemberDto, files: MulterFile[]): Promise<MemberDTO>;
  createRootMember(createMemberDto: CreateMemberDto, files: MulterFile[]): Promise<MemberDTO>;
  findAllMembers(): Promise<MemberDTO[]>;
  getMemberById(id: string): Promise<MemberDTO>;
  updateMember(id: string, updateData: UpdateMemberDto, files?: MulterFile[]): Promise<MemberDTO>;
  deleteMember(id: string): Promise<boolean>;
  findMembersInFamily(familyId: string): Promise<MemberDTO[]>;
  createSpouse(createSpouseDto: CreateSpouseDto, files?: MulterFile[]): Promise<MemberDTO | null>;
  createChild(createChildDto: CreateChildDto, files?: MulterFile[]): Promise<MemberDTO | null>;
  createFamilyLeader(createMemberDto: CreateMemberDto, files?: MulterFile[]): Promise<MemberDTO>;
  getMemberDetails(id: string): Promise<MemberDTO>;
  removeMember(id: string): Promise<MemberDTO>;
  searchMembers(familyId: string, searchDto: SearchMemberDto): Promise<PaginationDTO<MemberDTO>>;
}
