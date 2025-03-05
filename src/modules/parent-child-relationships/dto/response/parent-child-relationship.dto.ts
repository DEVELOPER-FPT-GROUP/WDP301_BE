import { ParentChildRelationship } from '../../schema/parent-child-relationship.schema';

export class ParentChildRelationshipDTO {
  parentId: string;
  childId: string;
  relaTypeId: string;
  birthOrder: number;

  static map(parentChildRelationship: ParentChildRelationship): ParentChildRelationshipDTO {
    const dto = new ParentChildRelationshipDTO();
    dto.parentId = String(parentChildRelationship.parentId);
    dto.childId = String(parentChildRelationship.childId);
    dto.relaTypeId = String(parentChildRelationship.relaTypeId);
    dto.birthOrder = parentChildRelationship.birthOrder;
    return dto;
  }
}
