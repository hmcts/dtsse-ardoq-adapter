import { ArdoqWorkspace, ArdoqWorkspaceConfig } from '../ArdoqWorkspace';

import { AxiosInstance, AxiosResponse } from 'axios';

const { Logger } = require('@hmcts/nodejs-logging');

type ArdoqComponentSearchResponse = {
  values: ArdoqComponentResponse[];
};
type ArdoqComponentResponse = {
  _id: string;
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

  public create(
    componentName: string,
    workspace: ArdoqWorkspaceConfig
  ): Promise<AxiosResponse<ArdoqComponentResponse, unknown>> {
    this.logger.debug('Calling POST /api/v2/components componentName:' + componentName);
    const workspaceId = new ArdoqWorkspace(workspace).getId();
    return this.httpClient.post(
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
  }
}
