import { BatchModel } from './BatchModel';

export class BatchRequest {
  constructor(
    public readonly component: BatchModel = new BatchModel(),
    public readonly references: BatchModel = new BatchModel(),
    public readonly respondWithEntities: boolean = false
  ) {}

  public toJson(): string {
    return JSON.stringify(this);
  }

  public getTotalNumberOfRecords(): number {
    return (
      this.component.getCreateLength() +
      this.component.getUpdateLength() +
      this.references.getCreateLength() +
      this.references.getUpdateLength()
    );
  }
}
