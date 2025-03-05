import { RelationshipType } from '../../schema/relationship-type.schema';

export class RelationshipTypeDTO {
  relaTypeId: string;
  relaTypeName: string;

  static map(relationshipType: RelationshipType): RelationshipTypeDTO {
    const dto = new RelationshipTypeDTO();
    dto.relaTypeId = String(relationshipType._id);
    dto.relaTypeName = relationshipType.relaTypeName;
    return dto;
  }
}
