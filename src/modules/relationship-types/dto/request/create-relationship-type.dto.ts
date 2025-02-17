import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRelationshipTypeDto {
  @IsNotEmpty()
  @IsString()
  relaTypeName: string;
}
