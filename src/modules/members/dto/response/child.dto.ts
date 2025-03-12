export class ChildDTO {
  childId?: string;
  fullName?: string;
  birthOrder?: number;

  constructor(childInfo: { childId: string, fullName: string, birthOrder: number }) {
    this.childId = childInfo.childId;
    this.fullName = childInfo.fullName;
    this.birthOrder = childInfo.birthOrder;

  }
}
