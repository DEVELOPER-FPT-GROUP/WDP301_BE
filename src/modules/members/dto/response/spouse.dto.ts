import { ChildDTO } from './child.dto';
import { MemberDTO } from './member.dto';

export class SpouseDTO {
  wife?: MemberDTO;
  husband?: MemberDTO;
  children?: ChildDTO[];
}
