import { Member } from '../../schema/member.schema';

export class MemberDTO {
  memberId: string;
  wifeId?: string;
  husbandId?: string;
  familyId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  dateOfDeath?: Date;
  placeOfBirth: string;
  placeOfDeath?: string;
  isAlive: boolean;
  generation: number;
  shortSummary?: string;
  gender: string;
  createdAt: Date;

  static map(member: Member): MemberDTO {
    const dto = new MemberDTO();
    dto.memberId = String(member._id);
    dto.familyId = String(member.familyId);
    dto.firstName = member.firstName;
    dto.middleName = member.middleName;
    dto.lastName = member.lastName;
    dto.dateOfBirth = member.dateOfBirth;
    dto.dateOfDeath = member.dateOfDeath;
    dto.placeOfBirth = member.placeOfBirth;
    dto.placeOfDeath = member.placeOfDeath;
    dto.isAlive = member.isAlive;
    dto.generation = member.generation;
    dto.shortSummary = member.shortSummary;
    dto.gender = member.gender;
    dto.createdAt = member.createdAt;
    return dto;
  }
}
