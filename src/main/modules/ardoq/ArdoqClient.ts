import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqWorkspace } from './ArdoqWorkspace';
import { Dependency } from './Dependency';
import { BatchActionResult, BatchCreate, BatchResult, BatchUpdate } from './batch/BatchModel';
import { BatchRequest } from './batch/BatchRequest';
import { Component } from './batch/Component';
import { Reference } from './batch/Reference';

import { AxiosInstance } from 'axios';
import config from 'config';

const { Logger } = require('@hmcts/nodejs-logging');

type SearchReferenceResponse = {
  id: string;
  version: string | undefined;
};

export class ArdoqClient {
  readonly componentTypeLookup = new Map<ArdoqWorkspace, string>([
    [ArdoqWorkspace.ARDOQ_VCS_HOSTING_WORKSPACE, 'p1681283498700'],
    [ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE, 'p1681283498700'],
    [ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE, 'p1659003743296'],
  ]);

  constructor(
    private httpClient: AxiosInstance,
    private cache: Map<string, Dependency> = new Map<string, Dependency>(),
    private logger = Logger.getLogger('ArdoqClient')
  ) {}

  private cacheResult(d: Dependency) {
    this.cache.set(d.name, d);
  }

  private isCached(d: Dependency): boolean {
    const found = this.cache.get(d.name);
    return found ? found.equals(d) : false;
  }

  private searchForComponent(componentName: string, workspace: ArdoqWorkspace) {
    return this.httpClient.get('/api/v2/components', {
      params: {
        rootWorkspace: config.get(workspace),
        name: componentName,
      },
      responseType: 'json',
    });
  }

  private createComponent(componentName: string, workspace: ArdoqWorkspace) {
    return this.httpClient.post(
      '/api/v2/components',
      {
        rootWorkspace: config.get(workspace),
        name: componentName,
        typeId: this.componentTypeLookup.get(workspace),
      },
      {
        params: {
          rootWorkspace: config.get(workspace),
          name: componentName,
          typeId: this.componentTypeLookup.get(workspace),
        },
        responseType: 'json',
      }
    );
  }

  private async createOrGetComponent(name: string, workspace: ArdoqWorkspace): Promise<string | null> {
    const searchRes = await this.searchForComponent(name, workspace);
    if (searchRes.status === 200 && searchRes.data.values.length > 0) {
      this.logger.debug('Found component: ' + name);
      return searchRes.data.values[0]._id;
    }
    const createRes = await this.createComponent(name, workspace);
    if (createRes.status !== 201) {
      this.logger.error('Unable to create component: ' + name);
      return null;
    }
    this.logger.debug('Component created: ' + name);
    return createRes.data._id;
  }

  public createVcsHostingComponent(name: string): Promise<string | null> {
    return this.createOrGetComponent(name, ArdoqWorkspace.ARDOQ_VCS_HOSTING_WORKSPACE);
  }

  public createCodeRepoComponent(name: string): Promise<string | null> {
    return this.createOrGetComponent(name, ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE);
  }

  private async searchForReference(source: string, target: string): Promise<undefined | SearchReferenceResponse> {
    const searchResponse = await this.httpClient.get('/api/v2/references', {
      params: {
        source,
        target,
      },
      responseType: 'json',
    });

    if (searchResponse.status === 200 && searchResponse.data.values.length > 0) {
      return {
        id: searchResponse.data.values[0]._id,
        version: searchResponse.data.values[0].customFields?.version,
      };
    }
  }

  public async referenceRequest(
    source: string,
    target: string,
    relationship: ArdoqRelationship,
    version?: string
  ): Promise<BatchCreate | BatchUpdate | undefined> {
    try {
      const existingReference = await this.searchForReference(source, target);

      if (!existingReference) {
        return {
          body: {
            source,
            target,
            type: relationship,
            customFields: version ? { version } : undefined,
          },
        } as BatchCreate;
      } else if (version && existingReference.version !== version) {
        return {
          id: existingReference.id,
          ifVersionMatch: 'latest',
          body: {
            source,
            target,
            type: relationship,
            customFields: { version },
          },
        } as BatchUpdate;
      }
    } catch (e) {
      this.logger.error('Error finding reference: ' + source + ' -> ' + target + ' : ' + e.message);
    }
  }

  public async updateDep(
    dependency: Dependency,
    batchRequest: BatchRequest
  ): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    if (this.isCached(dependency)) {
      this.logger.debug('Found cached result for: ' + dependency.name + ' - ' + dependency.componentId);
      return [ArdoqComponentCreatedStatus.EXISTING, dependency.componentId];
    }

    const searchResponse = await this.searchForComponent(
      dependency.name,
      ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE
    );

    if (searchResponse?.status === 200 && searchResponse.data.values.length > 0) {
      dependency.componentId = searchResponse.data.values[0]._id;
      this.logger.debug('Found component: ' + dependency.name + ' - ' + dependency.componentId);
      this.cacheResult(dependency);
      return [ArdoqComponentCreatedStatus.EXISTING, dependency.componentId];
    }

    // create a new object
    batchRequest.components.addCreate({
      body: {
        rootWorkspace: config.get(ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE),
        name: dependency.name,
        typeId: this.componentTypeLookup.get(ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE) ?? '',
      },
    } as BatchCreate);
    return [ArdoqComponentCreatedStatus.PENDING, null];
  }

  public async processBatchRequest(
    batchRequest: BatchRequest,
    counts: Map<ArdoqComponentCreatedStatus, number>
  ): Promise<Map<ArdoqComponentCreatedStatus, number>> {
    this.logger.debug(JSON.stringify(batchRequest));
    try {
      const response = await this.httpClient.post('/api/v2/batch', batchRequest);
      if (response.status === 200) {
        this.processBatchResponse(counts, response.data.components, response.data.references);
      } else {
        this.logger.error('Batch request failed status: ' + response.status);
        counts.set(
          ArdoqComponentCreatedStatus.ERROR,
          (counts.get(ArdoqComponentCreatedStatus.ERROR) ?? 0) + batchRequest.getTotalNumberOfRecords()
        );
      }
    } catch (e) {
      this.logger.error('Batch request failed: ' + e.message);
      this.logger.error(e);
      counts.set(
        ArdoqComponentCreatedStatus.ERROR,
        (counts.get(ArdoqComponentCreatedStatus.ERROR) ?? 0) + batchRequest.getTotalNumberOfRecords()
      );
    }

    return counts;
  }

  private processBatchResponse(
    counts: Map<ArdoqComponentCreatedStatus, number>,
    components?: BatchResult,
    references?: BatchResult
  ) {
    [...(components?.created ?? []), ...(references?.created ?? [])].forEach(u =>
      this.processBatchActionResult(u, true, counts)
    );
    [...(components?.updated ?? []), ...(references?.updated ?? [])].forEach(u =>
      this.processBatchActionResult(u, false, counts)
    );
  }

  private processBatchActionResult(
    res: BatchActionResult,
    isCreation: boolean,
    counts: Map<ArdoqComponentCreatedStatus, number>
  ) {
    const status = isCreation ? ArdoqComponentCreatedStatus.CREATED : ArdoqComponentCreatedStatus.EXISTING;
    const logText = isCreation ? 'Component created: ' : 'Component updated: ';
    if ((res.body as Component).typeId !== undefined) {
      this.logger.debug(logText + (res.body as Component).name + ' - ' + res.id);
    } else {
      this.logger.debug(logText + (res.body as Reference).source + ' - ' + (res.body as Reference).target);
    }
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
}
