import { ArdoqWorkspace } from '../ArdoqWorkspace';

import { AxiosInstance, AxiosResponse } from 'axios';
import config from 'config';

const { Logger } = require('@hmcts/nodejs-logging');

type ArdoqComponentSearchResponse = {
  values: ArdoqComponentResponse[];
};
type ArdoqComponentResponse = {
  _id: string;
};

export class ArdoqComponentRepository {
  static readonly componentTypeLookup = new Map<ArdoqWorkspace, string>([
    [ArdoqWorkspace.ARDOQ_VCS_HOSTING_WORKSPACE, 'p1681283498700'],
    [ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE, 'p1680004054236'],
    [ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE, 'p1659003743296'],
  ]);

  constructor(private httpClient: AxiosInstance, private logger = Logger.getLogger('ArdoqComponentRepository')) {}

  public search(
    componentName: string,
    workspace: ArdoqWorkspace
  ): Promise<AxiosResponse<ArdoqComponentSearchResponse, unknown>> {
    this.logger.debug('Calling GET /api/v2/components componentName:' + componentName);
    return this.httpClient.get('/api/v2/components', {
      params: {
        rootWorkspace: config.get(workspace),
        name: componentName,
      },
      responseType: 'json',
    });
  }

  public create(
    componentName: string,
    workspace: ArdoqWorkspace
  ): Promise<AxiosResponse<ArdoqComponentResponse, unknown>> {
    this.logger.debug('Calling POST /api/v2/components componentName:' + componentName);
    return this.httpClient.post(
      '/api/v2/components',
      {
        rootWorkspace: config.get(workspace),
        name: componentName,
        typeId: ArdoqComponentRepository.componentTypeLookup.get(workspace),
      },
      {
        params: {
          rootWorkspace: config.get(workspace),
          name: componentName,
          typeId: ArdoqComponentRepository.componentTypeLookup.get(workspace),
        },
        responseType: 'json',
      }
    );
  }
}
