import { IsString } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  firstName: String;
}
