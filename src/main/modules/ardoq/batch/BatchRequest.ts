import { SearchReferenceResponse } from '../repositories/ArdoqReferenceRepository';

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
      this.references.getUpdateLength() +
      this.references.getDeleteLength()
    );
  }

  public compareAndDeleteReferences(references: SearchReferenceResponse[]): BatchRequest {
    const updatingIds = this.references.getUpdateIds();
    const idsToDelete = references.filter(r => !updatingIds.includes(r.id)).map(r => r.id);
    this.references.setDeleteIds(idsToDelete.map(id => ({ id })));
    return this;
  }
}
