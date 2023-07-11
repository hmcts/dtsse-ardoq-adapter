import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqStatusCounts } from './ArdoqStatusCounts';
import { ArdoqWorkspace } from './ArdoqWorkspace';
import { BatchCreate, BatchUpdate } from './batch/BatchModel';
import { BatchRequest } from './batch/BatchRequest';
import { ArdoqBatchRespository } from './repositories/ArdoqBatchRespository';
import { ArdoqComponentRepository } from './repositories/ArdoqComponentRepository';
import { ArdoqReferenceRepository, SearchReferenceResponse } from './repositories/ArdoqReferenceRepository';
import { ArdoqReportRepository } from './repositories/ArdoqReportRespository';

import { AxiosInstance } from 'axios';
import config from 'config';
import { MemoryCache } from 'memory-cache-node';




const { Logger } = require('@hmcts/nodejs-logging');

export class ArdoqClient {
  private componentRepository: ArdoqComponentRepository;
  private referenceRepository: ArdoqReferenceRepository;
  private batchRepository: ArdoqBatchRespository;
  private reportRepository: ArdoqReportRepository;
  private static CACHE_TTL_CHECK_INTERVAL: number = config.get('ardoq.cache.ttlCheckInterval');
  private static MAX_CACHE_SIZE: number = config.get('ardoq.cache.maxSize');

  constructor(
    private httpClient: AxiosInstance,
    private cache = new Map<string, MemoryCache<string, string>>([
      [
        ArdoqWorkspace.ARDOQ_VCS_HOSTING_WORKSPACE,
        new MemoryCache<string, string>(ArdoqClient.CACHE_TTL_CHECK_INTERVAL, ArdoqClient.MAX_CACHE_SIZE),
      ],
      [
        ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE,
        new MemoryCache<string, string>(ArdoqClient.CACHE_TTL_CHECK_INTERVAL, ArdoqClient.MAX_CACHE_SIZE),
      ],
      [
        ArdoqWorkspace.ARDOQ_HMCTS_APPLICATIONS_WORKSPACE,
        new MemoryCache<string, string>(ArdoqClient.CACHE_TTL_CHECK_INTERVAL, ArdoqClient.MAX_CACHE_SIZE),
      ],
      [
        ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE,
        new MemoryCache<string, string>(ArdoqClient.CACHE_TTL_CHECK_INTERVAL, ArdoqClient.MAX_CACHE_SIZE),
      ],
    ]),
    private logger = Logger.getLogger('ArdoqClient')
  ) {
    this.componentRepository = new ArdoqComponentRepository(this.httpClient);
    this.referenceRepository = new ArdoqReferenceRepository(this.httpClient);
    this.batchRepository = new ArdoqBatchRespository(this.httpClient);
    this.reportRepository = new ArdoqReportRepository(this.httpClient);
  }

  private cacheResult(workspace: ArdoqWorkspace, name: string, componentId: string): void {
    this.cache.get(workspace)?.storePermanentItem(name, componentId);
  }

  private async cacheRead(workspace: ArdoqWorkspace, name: string): Promise<string | undefined> {
    // prime ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE cache if needed
    if (
      workspace === ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE &&
      this.cache.get(workspace)?.getItemCount() === 0
    ) {
      await this.primeCache();
    }
    return this.cache.get(workspace)?.retrieveItemValue(name);
  }

  private async primeCache(): Promise<void> {
    this.logger.debug('Priming ' + ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE + ' cache...');
    const dependencyCache = this.cache.get(ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE);
    if (!dependencyCache) {
      return;
    }
    const items = await this.reportRepository.get(config.get('ardoq.report.dependencyReportId'));
    items.map(item => {
      dependencyCache.storePermanentItem(item.name, item._id);
    });
    this.logger.debug('Done priming ' + ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE + ' cache.');
  }

  public async getOrCreateComponent(
    name: string,
    workspace: ArdoqWorkspace
  ): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    const cachedComponentId = await this.cacheRead(workspace, name);
    if (cachedComponentId) {
      this.logger.debug('Found cached result for: ' + name + ' - ' + cachedComponentId);
      return [ArdoqComponentCreatedStatus.EXISTING, cachedComponentId];
    }

    const searchRes = await this.componentRepository.search(name, workspace);
    if (searchRes.status === 200 && searchRes.data.values.length > 0) {
      this.logger.debug('Found component: ' + name);
      this.cacheResult(workspace, name, searchRes.data.values[0]._id);
      return [ArdoqComponentCreatedStatus.EXISTING, searchRes.data.values[0]._id];
    }

    const createRes = await this.componentRepository.create(name, workspace);
    if (createRes.status !== 201) {
      this.logger.error('Unable to create component: ' + name);
      return [ArdoqComponentCreatedStatus.ERROR, null];
    }
    this.logger.debug('Component created: ' + name);
    this.cacheResult(workspace, name, createRes.data._id);
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
    const cachedComponentId = await this.cacheRead(workspace, name);
    if (cachedComponentId) {
      return cachedComponentId;
    }

    const searchResponse = await this.componentRepository.search(name, workspace);

    if (searchResponse?.status === 200 && searchResponse.data.values.length > 0) {
      const componentId = searchResponse.data.values[0]._id;
      this.logger.debug('Found component: ' + name + ' - ' + componentId);
      this.cacheResult(workspace, name, componentId);
      return componentId;
    }

    return null;
  }

  public async processBatchRequest(batchRequest: BatchRequest): Promise<ArdoqStatusCounts> {
    return this.batchRepository.create(batchRequest);
  }
}
