import { AxiosInstance } from 'axios';

const { Logger } = require('@hmcts/nodejs-logging');

export interface DependencyReportItem {
  _id: string;
  name: string;
}
export class ArdoqReportRepository {
  constructor(
    private readonly httpClient: AxiosInstance,
    private readonly logger = Logger.getLogger('ArdoqReportRespository')
  ) {}

  public async get(reportId: string): Promise<DependencyReportItem[]> {
    this.logger.debug('Calling POST /api/report/{reportId}/export-data');

    try {
      const response = await this.httpClient.get('/api/report/' + reportId + '/export-data');
      if (response.status === 200) {
        return response.data as DependencyReportItem[];
      }
      this.logger.error('Failed to load reportId ' + reportId + ': ' + response.status);
    } catch (e) {
      this.logger.error('Failed to load reportId ' + reportId + ': ' + e.message);
      this.logger.error(e.response?.data);
    }
    return [];
  }
}
