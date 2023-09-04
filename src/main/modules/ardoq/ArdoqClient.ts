import { ArdoqCache } from './ArdoqCache';
import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqStatusCounts } from './ArdoqStatusCounts';
import { ArdoqWorkspaceConfig } from './ArdoqWorkspace';
import { BatchCreate, BatchUpdate } from './batch/BatchModel';
import { BatchRequest } from './batch/BatchRequest';
import { ArdoqBatchRespository } from './repositories/ArdoqBatchRespository';
import { ArdoqComponentRepository } from './repositories/ArdoqComponentRepository';
import { ArdoqReferenceRepository, SearchReferenceResponse } from './repositories/ArdoqReferenceRepository';
import { ArdoqReportRepository } from './repositories/ArdoqReportRespository';

import { AxiosInstance } from 'axios';
import config from 'config';

const { Logger } = require('@hmcts/nodejs-logging');

export class ArdoqClient {
  private componentRepository: ArdoqComponentRepository;
  private referenceRepository: ArdoqReferenceRepository;
  private batchRepository: ArdoqBatchRespository;
  private reportRepository: ArdoqReportRepository;

  constructor(
    private httpClient: AxiosInstance,
    private cache = new ArdoqCache(),
    private logger = Logger.getLogger('ArdoqClient')
  ) {
    this.componentRepository = new ArdoqComponentRepository(this.httpClient);
    this.referenceRepository = new ArdoqReferenceRepository(this.httpClient);
    this.batchRepository = new ArdoqBatchRespository(this.httpClient);
    this.reportRepository = new ArdoqReportRepository(this.httpClient);
  }

  private async cacheRead(workspace: ArdoqWorkspaceConfig, name: string): Promise<string | undefined> {
    // prime ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE cache if needed
    if (
      workspace === ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE &&
      this.cache.getItemCount(workspace) === 0
    ) {
      await this.primeCache();
    }
    return this.cache.get(workspace, name);
  }

  private async primeCache(): Promise<void> {
    this.cache.clear();
    this.logger.debug('Priming ' + ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE + ' cache...');
    const items = await this.reportRepository.get(config.get('ardoq.report.dependencyReportId'));
    items.forEach(item => {
      this.cache.set(ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE, item.name, item._id);
    });
    this.logger.debug('Done priming ' + ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE + ' cache.');
  }

  public async getOrCreateComponent(
    name: string,
    workspace: ArdoqWorkspaceConfig
  ): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    const cachedComponentId = await this.cacheRead(workspace, name);
    if (cachedComponentId) {
      this.logger.debug('Found cached result for: ' + name + ' - ' + cachedComponentId);
      return [ArdoqComponentCreatedStatus.EXISTING, cachedComponentId];
    }

    const searchRes = await this.componentRepository.search(name, workspace);
    if (searchRes.status === 200 && searchRes.data.values.length > 0) {
      this.logger.debug('Found component: ' + name);
      this.cache.set(workspace, name, searchRes.data.values[0]._id);
      return [ArdoqComponentCreatedStatus.EXISTING, searchRes.data.values[0]._id];
    }

    const createRes = await this.componentRepository.create(name, workspace);
    if (createRes.status !== 201) {
      this.logger.error('Unable to create component: ' + name);
      return [ArdoqComponentCreatedStatus.ERROR, null];
    }
    this.logger.debug('Component created: ' + name);
    this.cache.set(workspace, name, createRes.data._id);
    return [ArdoqComponentCreatedStatus.CREATED, createRes.data._id];
  }

  public createVcsHostingComponent(name: string): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    return this.getOrCreateComponent(name, ArdoqWorkspaceConfig.ARDOQ_VCS_HOSTING_WORKSPACE);
  }

  public createCodeRepoComponent(name: string): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    return this.getOrCreateComponent(name, ArdoqWorkspaceConfig.ARDOQ_CODE_REPOSITORY_WORKSPACE);
  }

  public async searchForReference(source: string, target: string): Promise<SearchReferenceResponse | undefined> {
    return this.referenceRepository.search(source, target);
  }

  getAllReferencesForRepository(sourceComponentId: string): Promise<Map<string, SearchReferenceResponse>> {
    return this.referenceRepository.getAllReferences(
      sourceComponentId,
      ArdoqWorkspaceConfig.ARDOQ_CODE_REPOSITORY_WORKSPACE,
      ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE
    );
  }

  public async getCreateOrUpdateReferenceModel(
    source: string,
    target: string,
    relationship: ArdoqRelationship,
    version?: string,
    name?: string,
    existingReference?: SearchReferenceResponse | undefined
  ): Promise<BatchCreate | BatchUpdate | undefined> {
    try {
      return this.referenceRepository.getCreateOrUpdateModel(
        existingReference ?? (await this.searchForReference(source, target)),
        source,
        target,
        relationship,
        version,
        name
      );
    } catch (e) {
      this.logger.error('Error finding reference: ' + source + ' -> ' + target + ' : ' + e.message);
    }
  }

  public async getComponentIdIfExists(
    name: string,
    workspace = ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE
  ): Promise<string | undefined> {
    const cachedComponentId = await this.cacheRead(workspace, name);
    // if we are looking for dependencies we assume the cache is up-to-date as we read all of them
    // into cache at the start of the process
    if (cachedComponentId || workspace === ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE) {
      return cachedComponentId;
    }

    const searchResponse = await this.componentRepository.search(name, workspace);

    if (searchResponse?.status === 200 && searchResponse.data.values.length > 0) {
      const componentId = searchResponse.data.values[0]._id;
      this.logger.debug('Found component: ' + name + ' - ' + componentId);
      this.cache.set(workspace, name, componentId);
      return componentId;
    }

    return undefined;
  }

  public async processBatchRequest(batchRequest: BatchRequest): Promise<ArdoqStatusCounts> {
    const res = await this.batchRepository.create(batchRequest);
    await this.primeCache();
    return res;
  }
}
