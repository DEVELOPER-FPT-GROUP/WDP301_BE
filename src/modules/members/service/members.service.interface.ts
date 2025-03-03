import { MemberDTO } from '../dto/response/member.dto';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { UpdateMemberDto } from '../dto/request/update-member.dto';
import { CreateSpouseDto } from '../dto/request/create-spouse.dto';
import { CreateChildDto } from '../dto/request/create-child.dto';
import { Promise } from 'mongoose';
import { SearchMemberDto } from '../dto/request/search-member.dto';
import { PaginationDTO } from '../../../utils/pagination.dto';

export interface IMembersService {
  createMember(createMemberDto: CreateMemberDto): Promise<MemberDTO>;
  findAllMembers(): Promise<MemberDTO[]>;
  getMemberById(id: string): Promise<MemberDTO>;
  updateMember(id: string, updateData: UpdateMemberDto): Promise<MemberDTO>;
  deleteMember(id: string): Promise<boolean>;
  findMembersInFamily(familyId: string): Promise<MemberDTO[]>;
  createSpouse(createSpouseDto: CreateSpouseDto): Promise<MemberDTO | null>;
  createChild(createChildDto: CreateChildDto): Promise<MemberDTO | null>;
  createFamilyLeader(createMemberDto: CreateMemberDto): Promise<MemberDTO>;
  getMemberDetails(id: string): Promise<MemberDTO>;
  searchMembers(searchDto: SearchMemberDto): Promise<PaginationDTO<MemberDTO>>
}
