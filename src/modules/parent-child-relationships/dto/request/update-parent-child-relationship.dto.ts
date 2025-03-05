import { PartialType } from '@nestjs/mapped-types';
import { CreateParentChildRelationshipDto } from './create-parent-child-relationship.dto';

export class UpdateParentChildRelationshipDto extends PartialType(CreateParentChildRelationshipDto) {}
