import { ArdoqComponentCreatedStatus } from '../ArdoqComponentCreatedStatus';
import { BatchActionResult, BatchResult } from '../batch/BatchModel';
import { BatchRequest } from '../batch/BatchRequest';
import { Component } from '../batch/Component';
import { Reference } from '../batch/Reference';

import { AxiosInstance } from 'axios';

const { Logger } = require('@hmcts/nodejs-logging');

export class ArdoqBatchRespository {
  constructor(private httpClient: AxiosInstance, private logger = Logger.getLogger('ArdoqBatchRespository')) {}

  public async create(batchRequest: BatchRequest): Promise<Map<ArdoqComponentCreatedStatus, number>> {
    this.logger.debug('Calling POST /api/v2/batch');

    try {
      const response = await this.httpClient.post('/api/v2/batch', batchRequest);

      if (response.status === 200) {
        return this.processBatchResponse(response.data.components, response.data.references);
      }
      this.logger.error('Batch request failed status: ' + response.status);
    } catch (e) {
      this.logger.error('Batch request failed: ' + e.message);
      this.logger.error(e);
    }

    return new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.ERROR, batchRequest.getTotalNumberOfRecords()],
    ]);
  }

  private processBatchResponse(
    components?: BatchResult,
    references?: BatchResult
  ): Map<ArdoqComponentCreatedStatus, number> {
    const counts: Map<ArdoqComponentCreatedStatus, number> = new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.EXISTING, 0],
      [ArdoqComponentCreatedStatus.CREATED, 0],
    ]);

    [...(components?.created ?? []), ...(references?.created ?? [])].forEach(u => {
      const status = this.getBatchActionResultStatus(u, true);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });
    [...(components?.updated ?? []), ...(references?.updated ?? [])].forEach(u => {
      const status = this.getBatchActionResultStatus(u, false);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });

    return counts;
  }

  private getBatchActionResultStatus(res: BatchActionResult, isCreation: boolean): ArdoqComponentCreatedStatus {
    const status = isCreation ? ArdoqComponentCreatedStatus.CREATED : ArdoqComponentCreatedStatus.EXISTING;
    const logText = isCreation ? 'Component created: ' : 'Component updated: ';
    if ((res.body as Component).typeId !== undefined) {
      this.logger.debug(logText + (res.body as Component).name + ' - ' + res.id);
    } else {
      this.logger.debug(logText + (res.body as Reference).source + ' - ' + (res.body as Reference).target);
    }

    return status;
  }
}
