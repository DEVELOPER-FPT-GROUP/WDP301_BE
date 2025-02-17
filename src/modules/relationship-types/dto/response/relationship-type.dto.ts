import { RelationshipType } from '../../schema/relationship-type.schema';

export class RelationshipTypeDTO {
  relaTypeName: string;

  static map(relationshipType: RelationshipType): RelationshipTypeDTO {
    const dto = new RelationshipTypeDTO();
    dto.relaTypeName = relationshipType.relaTypeName;
    return dto;
  }
}
