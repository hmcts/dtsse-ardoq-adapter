import { ArdoqRelationship } from '../ArdoqRelationship';

export interface Reference {
  source: string;
  target: string;
  type: ArdoqRelationship;
  customFields?: Record<string, unknown>;
}
