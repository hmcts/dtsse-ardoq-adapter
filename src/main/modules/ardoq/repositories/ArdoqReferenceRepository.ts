import { ArdoqRelationship } from '../ArdoqRelationship';
import { ArdoqWorkspace } from '../ArdoqWorkspace';
import { BatchCreate, BatchUpdate } from '../batch/BatchModel';

import { AxiosInstance, AxiosResponse } from 'axios';

const { Logger } = require('@hmcts/nodejs-logging');

export type SearchReferenceResponse = {
  id: string;
  version: string | undefined;
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
      };
    }
  }

  public getCreateOrUpdateModel(
    existingReference: SearchReferenceResponse | undefined,
    source: string,
    target: string,
    relationship: ArdoqRelationship,
    version?: string
  ): BatchCreate | BatchUpdate | undefined {
    if (!existingReference) {
      return {
        body: {
          source,
          target,
          type: relationship,
          customFields: version ? { sf_version: version } : undefined,
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
          customFields: { sf_version: version },
        },
      } as BatchUpdate;
    }
  }

  public async getAllReferences(
    sourceComponentId: string,
    rootWorkspace: ArdoqWorkspace,
    targetWorkspace: ArdoqWorkspace
  ): Promise<SearchReferenceResponse[]> {
    const references: SearchReferenceResponse[] = [];
    let response;
    do {
      response = await this.getNextPageOfReferences(sourceComponentId, rootWorkspace, targetWorkspace, response);
      if (response.status === 200) {
        references.push(
          ...response.data.values.map((r: { _id: string; customFields?: Record<string, string> }) => ({
            id: r._id,
            version: r.customFields?.sf_version,
          }))
        );
      }
    } while (response.status === 200 && response.data._links?.next?.href !== undefined);

    return references;
  }

  private getNextPageOfReferences(
    sourceComponentId: string,
    rootWorkspace: ArdoqWorkspace,
    targetWorkspace: ArdoqWorkspace,
    response: AxiosResponse | undefined
  ) {
    this.logger.debug(
      'Calling GET /api/v2/references source:' +
        sourceComponentId +
        'rootWorkspace: ' +
        rootWorkspace +
        ' targetWorkspace:' +
        targetWorkspace
    );
    const url = response?.data._links?.next?.href || '/api/v2/references';
    return this.httpClient.get(url, {
      params: {
        source: sourceComponentId,
        rootWorkspace,
        targetWorkspace,
      },
      responseType: 'json',
    });
  }
}
