import { MemberDTO } from '../dto/response/member.dto';
import { CreateMemberDto } from '../dto/request/create-member.dto';

export interface IMembersService {
  createMember(createMemberDto: CreateMemberDto): Promise<MemberDTO>;
  findAllMembers(): Promise<MemberDTO[]>;
  getMemberById(id: string): Promise<MemberDTO>;
  updateMember(id: string, updateData: Partial<CreateMemberDto>): Promise<MemberDTO>;
  deleteMember(id: string): Promise<boolean>;
}
