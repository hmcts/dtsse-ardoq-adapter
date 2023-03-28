import { ArdoqClient } from './ArdoqClient';
import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqRequest } from './ArdoqRequest';
import { Dependency } from './Dependency';
import { DependencyParser } from './DependencyParser';

const { Logger } = require('@hmcts/nodejs-logging');

export class RequestProcessor {
  client: ArdoqClient;
  parser: DependencyParser;
  logger = Logger.getLogger('RequestProcessor');

  constructor(client: ArdoqClient, parser: DependencyParser) {
    this.client = client;
    this.parser = parser;
  }

  public async processRequest(request: ArdoqRequest): Promise<Map<ArdoqComponentCreatedStatus, number>> {
    const depUpdate: Promise<ArdoqComponentCreatedStatus>[] = [];

    const vcsHostingComponentId = await this.client.createVcsHostingComponent(request.vcsHost);
    const codeRepoComponentId = await this.client.createCodeRepoComponent(request.codeRepository);

    // create relationships
    if (codeRepoComponentId) {
      await this.client.referenceRequest(request.hmctsApplication, codeRepoComponentId, ArdoqRelationship.MAINTAINS);
      if (vcsHostingComponentId) {
        await this.client.referenceRequest(vcsHostingComponentId, codeRepoComponentId, ArdoqRelationship.HOSTS);
      }
    }

    const deps = this.parser.fromDepRequest(request);
    deps.forEach((d: Dependency) => {
      depUpdate.push(
        this.client.updateDep(d).then(async ([status, componentId]) => {
          if (componentId && codeRepoComponentId) {
            await this.client.referenceRequest(codeRepoComponentId, componentId, ArdoqRelationship.DEPENDS_ON_VERSION);
            this.logger.debug('Created dependency reference: ' + codeRepoComponentId + ' -> ' + componentId);
          }
          return status;
        })
      );
    });

    const up = await Promise.all(depUpdate);
    const counts: Map<ArdoqComponentCreatedStatus, number> = new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.EXISTING, 0],
      [ArdoqComponentCreatedStatus.CREATED, 0],
      [ArdoqComponentCreatedStatus.ERROR, 0],
    ]);
    up.forEach(response => counts.set(response, 1 + (counts.get(response) ?? 0)));
    return counts;
  }
}
