import { ArdoqClient } from './ArdoqClient';
import { ArdoqComponentCreatedResponse } from './ArdoqComponentCreatedResponse';
import { Dependency } from './Dependency';

export class RequestProcessor {
  client: ArdoqClient;

  constructor(client: ArdoqClient) {
    this.client = client;
  }

  public async processRequest(deps: Map<string, Dependency>): Promise<Map<ArdoqComponentCreatedResponse, number>> {
    const depUpdate: Promise<ArdoqComponentCreatedResponse>[] = [];
    deps.forEach((d: Dependency) => {
      depUpdate.push(this.client.updateDep(d));
    });

    const up = await Promise.all(depUpdate);
    const counts: Map<ArdoqComponentCreatedResponse, number> = new Map<ArdoqComponentCreatedResponse, number>([
      [ArdoqComponentCreatedResponse.EXISTING, 0],
      [ArdoqComponentCreatedResponse.CREATED, 0],
      [ArdoqComponentCreatedResponse.ERROR, 0],
    ]);
    up.forEach(response => counts.set(response, 1 + (counts.get(response) ?? 0)));
    return counts;
  }
}
