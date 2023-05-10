import { BatchModel } from './BatchModel';

export class BatchRequest {
  constructor(
    public readonly components: BatchModel = new BatchModel(),
    public readonly references: BatchModel = new BatchModel(),
    public readonly options: Record<string, boolean> = { respondWithEntities: false }
  ) {}

  public getTotalNumberOfRecords(): number {
    return (
      this.components.getCreateLength() +
      this.components.getUpdateLength() +
      this.references.getCreateLength() +
      this.references.getUpdateLength()
    );
  }
}
