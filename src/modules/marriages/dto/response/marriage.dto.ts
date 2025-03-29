export class MarriageDTO {
  wifeId: string;
  husbandId: string;
  marriedDate: Date;
  isDivorced?: boolean;
  divorcedDate?: Date;
  createdByMemberId: string; // ✅ NEW

  static map(entity: any): MarriageDTO {
    return {
      wifeId: entity.wifeId.toString(),
      husbandId: entity.husbandId.toString(),
      marriedDate: entity.marriedDate,
      isDivorced: entity.isDivorced || false,
      divorcedDate: entity.divorcedDate || null,
      createdByMemberId: entity.createdByMemberId?.toString(), // ✅
    };
  }
}
