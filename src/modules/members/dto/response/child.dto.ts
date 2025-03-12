import { MemberDTO } from './member.dto';

export class ChildDTO {
  child?: MemberDTO;
  birthOrder?: number;

  constructor(childInfo: { child: MemberDTO , birthOrder: number }) {
    this.child = childInfo.child;
    this.birthOrder = childInfo.birthOrder;

  }

export class ChildDTO {
  childId?: string;
  fullName?: string;

}
