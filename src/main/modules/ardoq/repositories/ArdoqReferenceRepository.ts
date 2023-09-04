import { ArdoqRelationship } from '../ArdoqRelationship';
import { ArdoqWorkspace, ArdoqWorkspaceConfig } from '../ArdoqWorkspace';
import { BatchCreate, BatchUpdate } from '../batch/BatchModel';

import { AxiosInstance, AxiosResponse } from 'axios';

const { Logger } = require('@hmcts/nodejs-logging');

export type SearchReferenceResponse = {
  id: string;
  version: string | undefined;
  name: string | undefined;
};

export class ArdoqReferenceRepository {
  constructor(private httpClient: AxiosInstance, private logger = Logger.getLogger('ArdoqReferenceRepository')) {}

  public async search(source: string, target: string): Promise<undefined | SearchReferenceResponse> {
    this.logger.debug('Calling GET /api/v2/references source:' + source + ' target:' + target);
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
        version: searchResponse.data.values[0].customFields?.sf_version,
        name: searchResponse.data.values[0].customFields?.reference_target,
      };
    }
  }

  public getCreateOrUpdateModel(
    existingReference: SearchReferenceResponse | undefined,
    source: string,
    target: string,
    relationship: ArdoqRelationship,
    version?: string,
    name?: string
  ): BatchCreate | BatchUpdate | undefined {
    if (!existingReference) {
      return {
        body: {
          source,
          target,
          type: relationship,
          customFields: version ? { sf_version: version, reference_target: name } : undefined,
        },
      } as BatchCreate;
    } else if (version && version !== existingReference.version) {
      return {
        id: existingReference.id,
        ifVersionMatch: 'latest',
        body: {
          source,
          target,
          type: relationship,
          customFields: { sf_version: version, reference_target: existingReference.name },
        },
      } as BatchUpdate;
    }
  }

  public async getAllReferences(
    sourceComponentId: string,
    rootWorkspace: ArdoqWorkspaceConfig,
    targetWorkspace: ArdoqWorkspaceConfig
  ): Promise<Map<string, SearchReferenceResponse>> {
    const references = new Map<string, SearchReferenceResponse>();
    let response;
    do {
      response = await this.getNextPageOfReferences(sourceComponentId, rootWorkspace, targetWorkspace, response);
      if (response.status === 200) {
        response.data.values.map((r: { _id: string; target: string; customFields?: Record<string, string> }) =>
          references.set(r.target, {
            id: r._id,
            version: r.customFields?.sf_version,
            name: r.customFields?.reference_target,
          })
        );
      }
    } while (response.status === 200 && response.data._links?.next?.href !== undefined);

    return references;
  }

  private getNextPageOfReferences(
    sourceComponentId: string,
    rootWorkspace: ArdoqWorkspaceConfig,
    targetWorkspace: ArdoqWorkspaceConfig,
    response: AxiosResponse | undefined
  ) {
    const rootWorkspaceId = new ArdoqWorkspace(rootWorkspace).getId();
    const targetWorkspaceId = new ArdoqWorkspace(targetWorkspace).getId();
    this.logger.debug(
      'Calling GET /api/v2/references source:' +
        sourceComponentId +
        'rootWorkspace: ' +
        rootWorkspaceId +
        ' targetWorkspace:' +
        targetWorkspaceId
    );
    const url = response?.data._links?.next?.href || '/api/v2/references';
    return this.httpClient.get(url, {
      params: {
        source: sourceComponentId,
        rootWorkspaceId,
        targetWorkspaceId,
      },
      responseType: 'json',
    });
  }
}
