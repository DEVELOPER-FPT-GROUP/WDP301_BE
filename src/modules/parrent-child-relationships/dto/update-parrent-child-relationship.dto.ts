import { PartialType } from '@nestjs/mapped-types';
import { CreateParrentChildRelationshipDto } from './create-parrent-child-relationship.dto';

export class UpdateParrentChildRelationshipDto extends PartialType(CreateParrentChildRelationshipDto) {}
