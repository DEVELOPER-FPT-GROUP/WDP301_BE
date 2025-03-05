import { Member } from '../../schema/member.schema';
import { ParentDTO } from './parent.dto';
import { SpouseDTO } from './spouse.dto';

export class MemberDTO {
  memberId: string;
  familyId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  dateOfDeath?: Date;
  placeOfBirth: string;
  placeOfDeath?: string;
  burialPlace?: string;
  isAlive: boolean;
  generation: number;
  shortSummary?: string;
  gender: string;
  createdAt: Date;
  updatedAt: Date;
  parent?: ParentDTO;
  children?: string[];
  spouse?: SpouseDTO;
  isDeleted: boolean;

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
    dto.burialPlace = member.burialPlace;
    dto.isAlive = member.isAlive;
    dto.generation = member.generation;
    dto.shortSummary = member.shortSummary;
    dto.gender = member.gender;
    dto.createdAt = member.createdAt;
    dto.updatedAt = member.updatedAt;
    dto.isDeleted = member.isDeleted;
    return dto;
  }
}
