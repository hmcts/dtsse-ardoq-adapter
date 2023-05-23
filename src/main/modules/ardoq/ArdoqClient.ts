import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqStatusCounts } from './ArdoqStatusCounts';
import { ArdoqWorkspace } from './ArdoqWorkspace';
import { BatchCreate, BatchUpdate } from './batch/BatchModel';
import { BatchRequest } from './batch/BatchRequest';
import { ArdoqBatchRespository } from './repositories/ArdoqBatchRespository';
import { ArdoqComponentRepository } from './repositories/ArdoqComponentRepository';
import { ArdoqReferenceRepository, SearchReferenceResponse } from './repositories/ArdoqReferenceRepository';

import { AxiosInstance } from 'axios';

const { Logger } = require('@hmcts/nodejs-logging');

export class ArdoqClient {
  private componentRepository: ArdoqComponentRepository;
  private referenceRepository: ArdoqReferenceRepository;
  private batchRepository: ArdoqBatchRespository;

  constructor(
    private httpClient: AxiosInstance,
    private cache: Map<string, string> = new Map<string, string>(),
    private logger = Logger.getLogger('ArdoqClient')
  ) {
    this.componentRepository = new ArdoqComponentRepository(this.httpClient);
    this.referenceRepository = new ArdoqReferenceRepository(this.httpClient);
    this.batchRepository = new ArdoqBatchRespository(this.httpClient);
  }

  private cacheResult(name: string, componentId: string): void {
    this.cache.set(name, componentId);
  }

  public async getOrCreateComponent(
    name: string,
    workspace: ArdoqWorkspace
  ): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    const cachedComponentId = this.cache.get(name);
    if (cachedComponentId) {
      this.logger.debug('Found cached result for: ' + name + ' - ' + cachedComponentId);
      return [ArdoqComponentCreatedStatus.EXISTING, cachedComponentId];
    }

    const searchRes = await this.componentRepository.search(name, workspace);
    if (searchRes.status === 200 && searchRes.data.values.length > 0) {
      this.logger.debug('Found component: ' + name);
      this.cacheResult(name, searchRes.data.values[0]._id);
      return [ArdoqComponentCreatedStatus.EXISTING, searchRes.data.values[0]._id];
    }

    const createRes = await this.componentRepository.create(name, workspace);
    if (createRes.status !== 201) {
      this.logger.error('Unable to create component: ' + name);
      return [ArdoqComponentCreatedStatus.ERROR, null];
    }
    this.logger.debug('Component created: ' + name);
    this.cacheResult(name, createRes.data._id);
    return [ArdoqComponentCreatedStatus.CREATED, createRes.data._id];
  }

  public createVcsHostingComponent(name: string): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    return this.getOrCreateComponent(name, ArdoqWorkspace.ARDOQ_VCS_HOSTING_WORKSPACE);
  }

  public createCodeRepoComponent(name: string): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    return this.getOrCreateComponent(name, ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE);
  }

  public async searchForReference(source: string, target: string): Promise<SearchReferenceResponse | undefined> {
    return this.referenceRepository.search(source, target);
  }

  getAllReferencesForRepository(sourceComponentId: string): Promise<SearchReferenceResponse[]> {
    return this.referenceRepository.getAllReferences(
      sourceComponentId,
      ArdoqWorkspace.ARDOQ_HMCTS_APPLICATIONS_WORKSPACE,
      ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE
    );
  }

  public async getCreateOrUpdateReferenceModel(
    source: string,
    target: string,
    relationship: ArdoqRelationship,
    version?: string
  ): Promise<BatchCreate | BatchUpdate | undefined> {
    try {
      return this.referenceRepository.getCreateOrUpdateModel(
        await this.searchForReference(source, target),
        source,
        target,
        relationship,
        version
      );
    } catch (e) {
      this.logger.error('Error finding reference: ' + source + ' -> ' + target + ' : ' + e.message);
    }
  }

  public async getComponentIdIfExists(
    name: string,
    workspace = ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE
  ): Promise<string | null> {
    const cachedComponentId = this.cache.get(name);
    if (cachedComponentId) {
      return cachedComponentId;
    }

    const searchResponse = await this.componentRepository.search(name, workspace);

    if (searchResponse?.status === 200 && searchResponse.data.values.length > 0) {
      const componentId = searchResponse.data.values[0]._id;
      this.logger.debug('Found component: ' + name + ' - ' + componentId);
      this.cacheResult(name, componentId);
      return componentId;
    }

    return null;
  }

  public async processBatchRequest(batchRequest: BatchRequest): Promise<ArdoqStatusCounts> {
    return this.batchRepository.create(batchRequest);
  }
}
