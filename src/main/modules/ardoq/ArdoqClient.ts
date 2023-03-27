import { ArdoqComponentCreatedStatus } from './ArdoqComponentCreatedStatus';
import { ArdoqRelationship } from './ArdoqRelationship';
import { ArdoqWorkspace } from './ArdoqWorkspace';
import { Dependency } from './Dependency';

import { AxiosInstance } from 'axios';
import config from 'config';

const { Logger } = require('@hmcts/nodejs-logging');

export class ArdoqClient {
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
    if (found === undefined) {
      return false;
    }
    return found.equals(d);
  }

  private searchForComponent(componentName: string, workspace: ArdoqWorkspace) {
    return this.httpClient.get('/api/component/search', {
      params: {
        workspace: config.get(workspace),
        name: componentName,
      },
      responseType: 'json',
    });
  }

  private createComponent(componentName: string, workspace: ArdoqWorkspace) {
    return this.httpClient.post(
      '/api/component',
      {
        rootWorkspace: workspace,
        name: componentName,
      },
      {
        params: {
          workspace,
          name: componentName,
        },
        responseType: 'json',
      }
    );
  }

  private createOrGetComponent(name: string, workspace: ArdoqWorkspace): Promise<string | null> {
    return this.searchForComponent(name, workspace).then(searchRes => {
      if (searchRes.status === 200) {
        return searchRes.data[0].id;
      }
      return this.createComponent(name, workspace).then(createRes => {
        if (createRes.status !== 201) {
          this.logger.error('Unable to create component: ' + name);
          return null;
        }
        return createRes.data.id;
      });
    });
  }

  public createVcsHostingComponent(name: string): Promise<string | null> {
    return this.createOrGetComponent(name, ArdoqWorkspace.ARDOQ_VCS_HOSTING_WORKSPACE);
  }

  public createCodeRepoComponent(name: string): Promise<string | null> {
    return this.createOrGetComponent(name, ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE);
  }

  public async referenceRequest(
    source: string,
    target: string,
    relationship: ArdoqRelationship,
    version?: string
  ): Promise<void> {
    type ReferenceRequestData = {
      source: string;
      target: string;
      type: ArdoqRelationship;
      customFields?: {
        version: string;
      };
    };

    const data: ReferenceRequestData = {
      source,
      target,
      type: relationship,
    };

    if (version) {
      data.customFields = {
        version,
      };
    }

    await this.httpClient.post('/api/references', data, {
      responseType: 'json',
    });
  }

  public async updateDep(d: Dependency): Promise<[ArdoqComponentCreatedStatus, string | null]> {
    if (this.isCached(d)) {
      return [ArdoqComponentCreatedStatus.EXISTING, d.componentId];
    }

    const searchResponse = await this.searchForComponent(d.name, ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE);
    if (searchResponse.status === 200) {
      if (searchResponse.data.length !== 0) {
        this.cacheResult(d);
        return [ArdoqComponentCreatedStatus.EXISTING, d.componentId];
      }

      // create a new object
      const createResponse = await this.createComponent(d.name, ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE);
      if (createResponse.status === 201) {
        // Can now create a relationship between the application and this object
        this.cacheResult(d);
        return [ArdoqComponentCreatedStatus.CREATED, d.componentId];
      }
      return [ArdoqComponentCreatedStatus.ERROR, null];
    }
    return [ArdoqComponentCreatedStatus.ERROR, null];
  }
}
