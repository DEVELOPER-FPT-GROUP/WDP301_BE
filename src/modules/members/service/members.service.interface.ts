import { MemberDTO } from '../dto/response/member.dto';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { UpdateMemberDto } from '../dto/request/update-member.dto';
import { CreateSpouseDto } from '../dto/request/create-spouse.dto';

export interface IMembersService {
  createMember(createMemberDto: CreateMemberDto): Promise<MemberDTO>;
  findAllMembers(): Promise<MemberDTO[]>;
  getMemberById(id: string): Promise<MemberDTO>;
  updateMember(id: string, updateData: Partial<UpdateMemberDto>): Promise<MemberDTO>;
  deleteMember(id: string): Promise<boolean>;
  findMembersInFamily(familyId: string): Promise<MemberDTO[]>;
  createSpouse(createSpouseDto: CreateSpouseDto): Promise<MemberDTO | null>;
}
