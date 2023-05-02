import { ArdoqRelationship } from '../ArdoqRelationship';

export class Reference {
  constructor(
    public source: string,
    public target: string,
    public type: ArdoqRelationship,
    public customFields?: Record<string, unknown>
  ) {}
}
