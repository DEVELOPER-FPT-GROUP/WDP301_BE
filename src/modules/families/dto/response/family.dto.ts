import { Family } from '../../schema/family.schema';

export class FamilyDTO {
  familyId: string;

  adminAccountId: string;

  familyName: string;

  createdAt: Date;

  static map(family: Family) {
    const dto = new FamilyDTO();
    dto.familyId = String(family._id);
    dto.adminAccountId = family.adminAccountId;
    dto.familyName = family.familyName;
    dto.createdAt = family.createdAt;
    return dto;
  }
}
