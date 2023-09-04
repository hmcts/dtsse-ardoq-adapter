import { ArdoqClient } from './ArdoqClient';
import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqRequest } from './ArdoqRequest';
import { ArdoqStatusCounts } from './ArdoqStatusCounts';
import { ArdoqWorkspace, ArdoqWorkspaceConfig } from './ArdoqWorkspace';
import { Dependency } from './Dependency';
import { DependencyParser } from './DependencyParser';
import { BatchCreate, BatchUpdate } from './batch/BatchModel';
import { BatchRequest } from './batch/BatchRequest';
import { ArdoqComponentRepository } from './repositories/ArdoqComponentRepository';
import { SearchReferenceResponse } from './repositories/ArdoqReferenceRepository';

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
    const languageComponentId = request.language
      ? (
          await this.client.getOrCreateComponent(request.language, ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE)
        )[1]
      : null;

    const references = this.initialiseBaseReferences(
      request.hmctsApplication,
      codeRepoComponentId,
      vcsHostingComponentId,
      languageComponentId,
      request.languageVersion,
      request.language
    );

    // Remove GET component when it's for dependencies as we _know_ we've loaded them all via the report into cache

    const counts = new ArdoqStatusCounts();
    const deps = this.parser.fromDepRequest(request);
    const dependencyReferences = await this.getAllCurrentReferences(codeRepoComponentId);
    const batchRequest = await this.buildBatchRequest(
      deps,
      references,
      dependencyReferences,
      counts,
      codeRepoComponentId
    );

    // cleanup any references that are no longer required
    batchRequest.compareAndDeleteReferences(dependencyReferences);

    if (batchRequest.getTotalNumberOfRecords() === 0) {
      this.logger.info('No batch request to process');
      return counts;
    }
    // process the batch request
    return counts.merge(await this.client.processBatchRequest(batchRequest));
  }

  private async buildBatchRequest(
    deps: Record<string, Dependency>,
    references: Promise<BatchCreate | BatchUpdate | undefined>[],
    dependencyReferences: Map<string, SearchReferenceResponse>,
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
          const workspaceId = new ArdoqWorkspace(ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE).getId();
          batchRequest.components.addCreate({
            body: {
              rootWorkspace: workspaceId,
              name: d.name,
              typeId:
                ArdoqComponentRepository.componentTypeLookup.get(ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE) ??
                '',
            },
          } as BatchCreate);
          // add a create for all of the references too?
        } else if (componentId && codeRepoComponentId) {
          const existingReference = dependencyReferences.get(componentId);

          const depRefs = await this.client.getCreateOrUpdateReferenceModel(
            codeRepoComponentId,
            componentId,
            ArdoqRelationship.DEPENDS_ON_VERSION,
            d.version,
            d.name,
            existingReference
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
    vcsHostingComponentId: string | null,
    languageComponentId: string | null,
    languageVersion: string | undefined,
    language: string | undefined
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
      if (languageComponentId) {
        references.push(
          this.client.getCreateOrUpdateReferenceModel(
            codeRepoComponentId,
            languageComponentId,
            ArdoqRelationship.DEPENDS_ON_VERSION,
            languageVersion,
            language
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
    if (codeRepoComponentId) {
      return this.client.getAllReferencesForRepository(codeRepoComponentId);
    }
    return new Map<string, SearchReferenceResponse>();
  }
}
