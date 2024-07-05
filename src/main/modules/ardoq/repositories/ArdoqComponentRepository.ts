import { ArdoqWorkspace, ArdoqWorkspaceConfig } from '../ArdoqWorkspace';

import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const { Logger } = require('@hmcts/nodejs-logging');

type ArdoqComponentSearchResponse = {
  values: ArdoqComponentResponse[];
};
type ArdoqComponentResponse = {
  _id: string;
  _meta: {
    created: string;
    lastUpdated: string;
  };
  customFields: {
    products_using_this_dependency: string;
  };
};

export class ArdoqComponentRepository {
  static readonly componentTypeLookup = new Map<ArdoqWorkspaceConfig, string>([
    [ArdoqWorkspaceConfig.ARDOQ_VCS_HOSTING_WORKSPACE, 'p1663692402277'],
    [ArdoqWorkspaceConfig.ARDOQ_CODE_REPOSITORY_WORKSPACE, 'p1680004054236'],
    [ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE, 'p1688398121677'],
  ]);

  constructor(
    private httpClient: AxiosInstance,
    private logger = Logger.getLogger('ArdoqComponentRepository')
  ) {}

  public search(
    componentName: string,
    workspace: ArdoqWorkspaceConfig
  ): Promise<AxiosResponse<ArdoqComponentSearchResponse, unknown>> {
    this.logger.debug('Calling GET /api/v2/components componentName:' + componentName);
    const workspaceId = new ArdoqWorkspace(workspace).getId();
    return this.httpClient.get('/api/v2/components', {
      params: {
        rootWorkspace: workspaceId,
        name: componentName,
      },
      responseType: 'json',
    });
  }

  public async create(
    componentName: string,
    workspace: ArdoqWorkspaceConfig
  ): Promise<AxiosResponse<ArdoqComponentResponse, unknown>> {
    this.logger.debug('Calling POST /api/v2/components componentName:' + componentName);
    const workspaceId = new ArdoqWorkspace(workspace).getId();
    try {
      return await this.httpClient.post(
        '/api/v2/components',
        {
          rootWorkspace: workspaceId,
          name: componentName,
          typeId: ArdoqComponentRepository.componentTypeLookup.get(workspace),
        },
        {
          params: {
            rootWorkspace: workspaceId,
            name: componentName,
            typeId: ArdoqComponentRepository.componentTypeLookup.get(workspace),
          },
          responseType: 'json',
        }
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        return (error as AxiosError).response as AxiosResponse<ArdoqComponentResponse, unknown>;
      } else {
        throw error;
      }
    }
  }
}
