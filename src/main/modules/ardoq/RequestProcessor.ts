import { ArdoqClient } from './ArdoqClient';
import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqRequest } from './ArdoqRequest';
import { Dependency } from './Dependency';
import { DependencyParser } from './DependencyParser';
import { BatchCreate, BatchUpdate } from './batch/BatchModel';
import { BatchRequest } from './batch/BatchRequest';

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
    const vcsHostingComponentId = await this.client.createVcsHostingComponent(request.vcsHost);
    const codeRepoComponentId = await this.client.createCodeRepoComponent(request.codeRepository);

    const references = [];
    // create relationships
    if (codeRepoComponentId) {
      references.push(
        this.client.referenceRequest(request.hmctsApplication, codeRepoComponentId, ArdoqRelationship.MAINTAINS)
      );
      if (vcsHostingComponentId) {
        references.push(
          this.client.referenceRequest(vcsHostingComponentId, codeRepoComponentId, ArdoqRelationship.HOSTS)
        );
      }
    }

    const counts: Map<ArdoqComponentCreatedStatus, number> = new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.EXISTING, 0],
      [ArdoqComponentCreatedStatus.CREATED, 0],
      [ArdoqComponentCreatedStatus.ERROR, 0],
    ]);

    const deps = this.parser.fromDepRequest(request);

    const batchRequest = new BatchRequest();
    await Promise.all(references).then(r => {
      this.addReferences(r, batchRequest);
    });
    await Promise.all(
      Object.values(deps).map(async (d: Dependency) => {
        const [status, componentId] = await this.client.updateDep(d, batchRequest);
        if (componentId && codeRepoComponentId) {
          const depRefs = await this.client.referenceRequest(
            codeRepoComponentId,
            componentId,
            ArdoqRelationship.DEPENDS_ON_VERSION
          );
          this.addReferences([depRefs], batchRequest);
          this.logger.debug('Created dependency reference: ' + codeRepoComponentId + ' -> ' + componentId);
        }
        counts.set(status, 1 + (counts.get(status) ?? 0));
        return status;
      })
    );

    // process the batch request
    return this.client.processBatchRequest(batchRequest, counts);
  }

  private addReferences(references: (BatchCreate | BatchUpdate | undefined)[], batchRequest: BatchRequest) {
    references.forEach(r => {
      if (r && 'ifVersionMatch' in r) {
        batchRequest.references.addUpdate(r as BatchUpdate);
      } else if (r) {
        batchRequest.references.addCreate(r as BatchCreate);
      }
    });
  }
}
