import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';

export class ArdoqStatusCounts {
  public readonly counts: Map<ArdoqComponentCreatedStatus, number>;

  constructor() {
    this.counts = new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.EXISTING, 0],
      [ArdoqComponentCreatedStatus.CREATED, 0],
      [ArdoqComponentCreatedStatus.ERROR, 0],
      [ArdoqComponentCreatedStatus.PENDING, 0],
    ]);
  }

  public add(status: ArdoqComponentCreatedStatus, count: number): ArdoqStatusCounts {
    this.counts.set(status, (this.counts.get(status) ?? 0) + count);
    return this;
  }

  public merge(other: ArdoqStatusCounts): ArdoqStatusCounts {
    other.counts.forEach((count, status) => {
      this.add(status, count);
    });
    return this;
  }
}
