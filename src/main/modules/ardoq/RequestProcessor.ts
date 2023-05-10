import { ArdoqClient } from './ArdoqClient';
import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqRequest } from './ArdoqRequest';
import { ArdoqWorkspace } from './ArdoqWorkspace';
import { Dependency } from './Dependency';
import { DependencyParser } from './DependencyParser';
import { BatchCreate, BatchUpdate } from './batch/BatchModel';
import { BatchRequest } from './batch/BatchRequest';
import { ArdoqReferenceRepository } from './repositories/ArdoqReferenceRepository';

import config from 'config';

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
    const vcsHostingComponentId = (await this.client.createVcsHostingComponent(request.vcsHost))[1];
    const codeRepoComponentId = (await this.client.createCodeRepoComponent(request.codeRepository))[1];

    const references = [];
    // create relationships
    if (codeRepoComponentId) {
      references.push(
        this.client.getCreateOrUpdateReferenceModel(
          request.hmctsApplication,
          codeRepoComponentId,
          ArdoqRelationship.MAINTAINS
        )
      );
      if (vcsHostingComponentId) {
        references.push(
          this.client.getCreateOrUpdateReferenceModel(
            vcsHostingComponentId,
            codeRepoComponentId,
            ArdoqRelationship.HOSTS
          )
        );
      }
    }

    const counts: Map<ArdoqComponentCreatedStatus, number> = new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.EXISTING, 0],
      [ArdoqComponentCreatedStatus.CREATED, 0],
      [ArdoqComponentCreatedStatus.ERROR, 0],
      [ArdoqComponentCreatedStatus.PENDING, 0],
    ]);

    const deps = this.parser.fromDepRequest(request);

    const batchRequest = new BatchRequest();
    await Promise.all(references).then(r => {
      this.addReferences(r, batchRequest);
    });
    await Promise.all(
      Object.values(deps).map(async (d: Dependency) => {
        const componentId = d.componentId ?? (await this.client.getComponentIdIfExists(d.name));
        const status = componentId ? ArdoqComponentCreatedStatus.EXISTING : ArdoqComponentCreatedStatus.PENDING;
        // if there is no componentId we need to create this component via the BatchRequest
        if (!componentId) {
          batchRequest.components.addCreate({
            body: {
              rootWorkspace: config.get(ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE),
              name: d.name,
              typeId:
                ArdoqReferenceRepository.componentTypeLookup.get(ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE) ??
                '',
            },
          } as BatchCreate);
        } else if (componentId && codeRepoComponentId) {
          const depRefs = await this.client.getCreateOrUpdateReferenceModel(
            codeRepoComponentId,
            componentId,
            ArdoqRelationship.DEPENDS_ON_VERSION,
            d.version
          );
          this.addReferences([depRefs], batchRequest);
          this.logger.debug('Created dependency reference: ' + codeRepoComponentId + ' -> ' + componentId);
        }
        counts.set(status, 1 + (counts.get(status) ?? 0));
        return status;
      })
    );

    // process the batch request
    const batchCounts = await this.client.processBatchRequest(batchRequest);

    batchCounts.forEach((v, k) => {
      counts.set(k, v + (counts.get(k) ?? 0));
    });

    // @todo need to delete references which are no longer relevant

    return counts;
  }

  private addReferences(references: (BatchCreate | BatchUpdate | undefined)[], batchRequest: BatchRequest) {
    references.forEach(r => {
      if (r && 'ifVersionMatch' in r) {
        batchRequest.references.addUpdate(r);
      } else if (r) {
        batchRequest.references.addCreate(r);
      }
    });
  }
}
