import { ArdoqClient } from './ArdoqClient';
import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqRequest } from './ArdoqRequest';
import { ArdoqStatusCounts } from './ArdoqStatusCounts';
import { ArdoqWorkspace } from './ArdoqWorkspace';
import { Dependency } from './Dependency';
import { DependencyParser } from './DependencyParser';
import { BatchCreate, BatchUpdate } from './batch/BatchModel';
import { BatchRequest } from './batch/BatchRequest';
import { ArdoqReferenceRepository, SearchReferenceResponse } from './repositories/ArdoqReferenceRepository';

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

  public async processRequest(request: ArdoqRequest): Promise<ArdoqStatusCounts> {
    const vcsHostingComponentId = (await this.client.createVcsHostingComponent(request.vcsHost))[1];
    const codeRepoComponentId = (await this.client.createCodeRepoComponent(request.codeRepository))[1];

    const references = this.initialiseBaseReferences(
      request.hmctsApplication,
      vcsHostingComponentId,
      codeRepoComponentId
    );

    const counts = new ArdoqStatusCounts();
    const deps = this.parser.fromDepRequest(request);
    const batchRequest = await this.buildBatchRequest(deps, references, counts, codeRepoComponentId);

    // cleanup any references that are no longer required
    batchRequest.compareAndDeleteReferences(await this.getAllCurrentReferences(codeRepoComponentId));

    // process the batch request
    return counts.merge(await this.client.processBatchRequest(batchRequest));
  }

  private async buildBatchRequest(
    deps: Record<string, Dependency>,
    references: Promise<BatchCreate | BatchUpdate | undefined>[],
    counts: ArdoqStatusCounts,
    codeRepoComponentId: string | null
  ) {
    const batchRequest = new BatchRequest();
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
        counts.add(status, 1);
        return status;
      })
    );

    await Promise.all(references).then(r => {
      this.addReferences(r, batchRequest);
    });

    return batchRequest;
  }

  private initialiseBaseReferences(
    hmctsApplication: string,
    codeRepoComponentId: string | null,
    vcsHostingComponentId: string | null
  ) {
    const references = [];
    if (codeRepoComponentId) {
      references.push(
        this.client.getCreateOrUpdateReferenceModel(hmctsApplication, codeRepoComponentId, ArdoqRelationship.MAINTAINS)
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
    return references;
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

  private async getAllCurrentReferences(codeRepoComponentId: string | null) {
    const allReferences: SearchReferenceResponse[] = [];
    if (codeRepoComponentId) {
      allReferences.push(...(await this.client.getAllReferencesForRepository(codeRepoComponentId)));
    }
    return allReferences;
  }
}
