import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateParentChildRelationshipDto {
  @IsNotEmpty()
  @IsString()
  parentId: string;

  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsString()
  relaTypeId: string;

  @IsNumber()
  birthOrder: number;
}
