import { ArdoqComponentCreatedStatus } from '../ArdoqComponentCreatedStatus';
import { ArdoqStatusCounts } from '../ArdoqStatusCounts';
import { BatchActionResult, BatchResult } from '../batch/BatchModel';
import { BatchRequest } from '../batch/BatchRequest';
import { Component } from '../batch/Component';
import { Reference } from '../batch/Reference';

import { AxiosInstance } from 'axios';

const { Logger } = require('@hmcts/nodejs-logging');

export class ArdoqBatchRespository {
  constructor(
    private readonly httpClient: AxiosInstance,
    private readonly logger = Logger.getLogger('ArdoqBatchRespository')
  ) {}

  public async create(batchRequest: BatchRequest): Promise<ArdoqStatusCounts> {
    this.logger.debug('Calling POST /api/v2/batch');

    try {
      const response = await this.httpClient.post('/api/v2/batch', batchRequest);
      this.logger.info(JSON.stringify(response.data));
      if (response.status === 200) {
        return this.processBatchResponse(response.data.components, response.data.references);
      }
      this.logger.error('Batch request failed status: ' + response.status);
    } catch (e) {
      this.logger.error('Batch request failed: ' + e.message);
      this.logger.error(e.response?.data);
    }

    const counts = new ArdoqStatusCounts();
    return counts.add(ArdoqComponentCreatedStatus.ERROR, batchRequest.getTotalNumberOfRecords());
  }

  private processBatchResponse(components?: BatchResult, references?: BatchResult): ArdoqStatusCounts {
    const counts = this.processCreatedAndUpdated(components?.created, references?.created, true);
    return counts.merge(this.processCreatedAndUpdated(components?.updated, references?.updated, false));
  }

  processCreatedAndUpdated(
    components: BatchActionResult[] | undefined,
    references: BatchActionResult[] | undefined,
    isCreation: boolean
  ): ArdoqStatusCounts {
    const counts = new ArdoqStatusCounts();

    [...(components ?? []), ...(references ?? [])].forEach(u => {
      const status = this.getBatchActionResultStatus(u, isCreation);
      counts.add(status, 1);
    });

    return counts;
  }

  private getBatchActionResultStatus(res: BatchActionResult, isCreation: boolean): ArdoqComponentCreatedStatus {
    const status = isCreation ? ArdoqComponentCreatedStatus.CREATED : ArdoqComponentCreatedStatus.EXISTING;
    const logText = isCreation ? 'Component created: ' : 'Component updated: ';
    if ('typeId' in res.body) {
      this.logger.debug(logText + (res.body as Component).name + ' - ' + res.id);
    } else {
      this.logger.debug(logText + (res.body as Reference).source + ' - ' + (res.body as Reference).target);
    }

    return status;
  }
}
