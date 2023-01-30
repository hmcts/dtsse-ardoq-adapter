import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';
import { Application } from 'express';
import { get, set } from 'lodash';

export class PropertiesVolume {
  enableFor(server: Application): void {
    require('dotenv').config();
    set(config, 'ardoq.apiKey', process.env.ARDOQ_API_KEY ?? 'ARDOQ_API_KEY');
    set(config, 'ardoq.apiUrl', process.env.ARDOQ_API_URL ?? 'ARDOQ_API_URL');
    set(config, 'ardoq.apiWorkspace', process.env.ARDOQ_API_WORKSPACE ?? 'ARDOQ_API_WORKSPACE');
    set(config, 'serverApiKey.primary', process.env.SERVER_API_KEY_PRIMARY ?? 'SERVER_API_KEY_PRIMARY');
    set(config, 'serverApiKey.secondary', process.env.SERVER_API_KEY_SECONDARY ?? 'SERVER_API_KEY_SECONDARY');
    if (server.locals.ENV !== 'development') {
      propertiesVolume.addTo(config);

      this.setSecret('secrets.dtsse.AppInsightsConnectionString', 'appInsights.instrumentationKey');
      this.setSecret('secrets.dtsse.ardoq-api-key', 'ardoq.apiKey');
      this.setSecret('secrets.dtsse.ardoq-api-url', 'ardoq.apiUrl');
      this.setSecret('secrets.dtsse.ardoq-api-workspace', 'ardoq.apiWorkspace');

      this.setSecret('secrets.dtsse.server-api-key-primary', 'serverApiKey.primary');
      this.setSecret('secrets.dtsse.server-api-key-secondary', 'serverApiKey.secondary');
    }
  }

  private setSecret(fromPath: string, toPath: string): void {
    if (config.has(fromPath)) {
      set(config, toPath, get(config, fromPath));
    }
  }
}
