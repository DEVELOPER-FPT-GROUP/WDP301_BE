import { MemberDTO } from "src/modules/members/dto/response/member.dto";

export interface FacialSearchResult {
  memberId: string;
  similarity: number;
  memberDetails?: MemberDTO;
  confidenceLevel?: 'high' | 'medium' | 'low';
}