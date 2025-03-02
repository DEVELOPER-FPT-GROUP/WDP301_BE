import { MemberDTO } from '../dto/response/member.dto';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { UpdateMemberDto } from '../dto/request/update-member.dto';
import { CreateSpouseDto } from '../dto/request/create-spouse.dto';
import { CreateChildDto } from '../dto/request/create-child.dto';
import { Promise } from 'mongoose';

export interface IMembersService {
  createMember(createMemberDto: CreateMemberDto): Promise<MemberDTO>;
  findAllMembers(): Promise<MemberDTO[]>;
  getMemberById(id: string): Promise<MemberDTO>;
  updateMember(id: string, updateData: UpdateMemberDto): Promise<MemberDTO>;
  deleteMember(id: string): Promise<boolean>;
  findMembersInFamily(familyId: string): Promise<MemberDTO[]>;
  createSpouse(createSpouseDto: CreateSpouseDto): Promise<MemberDTO | null>;
  createChild(createChildDto: CreateChildDto): Promise<MemberDTO | null>;
  createFamilyLeader(createMemberDto: CreateMemberDto): Promise<MemberDTO>
}
