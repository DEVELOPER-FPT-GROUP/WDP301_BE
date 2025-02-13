import { Member } from '../../schema/member.schema';

export class MemberDTO {
  familyId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  dateOfDeath?: Date;
  placeOfBirth: string;
  placeOfDeath?: string;
  isAlive: boolean;
  generation: number;
  gender: string;
  createdAt: Date;

  static map(member: Member): MemberDTO {
    const dto = new MemberDTO();
    dto.familyId = member.familyId;
    dto.firstName = member.firstName;
    dto.lastName = member.lastName;
    dto.dateOfBirth = member.dateOfBirth;
    dto.dateOfDeath = member.dateOfDeath;
    dto.placeOfBirth = member.placeOfBirth;
    dto.placeOfDeath = member.placeOfDeath;
    dto.isAlive = member.isAlive;
    dto.generation = member.generation;
    dto.gender = member.gender;
    dto.createdAt = member.createdAt;
    return dto;
  }
}

export class MemberResponse {
  member: MemberDTO;
}

