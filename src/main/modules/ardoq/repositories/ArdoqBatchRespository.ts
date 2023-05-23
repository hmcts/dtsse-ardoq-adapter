import { ArdoqComponentCreatedStatus } from '../ArdoqComponentCreatedStatus';
import { ArdoqStatusCounts } from '../ArdoqStatusCounts';
import { BatchAction, BatchResult, BatchType } from '../batch/BatchModel';
import { BatchRequest } from '../batch/BatchRequest';

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
    const counts = this.processCreatedAndUpdated(components, BatchType.COMPONENT);
    return counts.merge(this.processCreatedAndUpdated(references, BatchType.REFERENCE));
  }

  processCreatedAndUpdated(items: BatchResult | undefined, batchType: BatchType): ArdoqStatusCounts {
    const counts = new ArdoqStatusCounts();

    items?.created?.forEach(u => {
      const status = this.getBatchActionResultStatus(u.id, batchType, BatchAction.CREATE);
      counts.add(status, 1);
    });
    items?.updated?.forEach(u => {
      const status = this.getBatchActionResultStatus(u.id, batchType, BatchAction.UPDATE);
      counts.add(status, 1);
    });
    items?.deleted?.forEach(u => {
      const status = this.getBatchActionResultStatus(u.id, batchType, BatchAction.DELETE);
      counts.add(status, 1);
    });

    return counts;
  }

  private getBatchActionResultStatus(id: string, type: BatchType, action: BatchAction): ArdoqComponentCreatedStatus {
    this.logger.debug(type + ' ' + action + ' id: ' + id);
    switch (action) {
      case BatchAction.CREATE:
        return ArdoqComponentCreatedStatus.CREATED;
      case BatchAction.UPDATE:
        return ArdoqComponentCreatedStatus.EXISTING;
      case BatchAction.DELETE:
        return ArdoqComponentCreatedStatus.DELETED;
    }
  }
}
