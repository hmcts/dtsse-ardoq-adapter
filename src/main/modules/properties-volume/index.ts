import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';
import { Application } from 'express';
import { get, set } from 'lodash';

const { Logger } = require('@hmcts/nodejs-logging');

export class PropertiesVolume {
  enableFor(server: Application): void {
    const logger = Logger.getLogger('properties-volume');
    require('dotenv').config();
    set(config, 'ardoq.apiKey', process.env.ARDOQ_API_KEY ?? 'ARDOQ_API_KEY');
    set(config, 'ardoq.apiUrl', process.env.ARDOQ_API_URL ?? 'ARDOQ_API_URL');
    set(config, 'ardoq.apiWorkspace', process.env.ARDOQ_API_WORKSPACE ?? 'ARDOQ_API_WORKSPACE');
    set(config, 'serverApiKey.primary', process.env.SERVER_API_KEY_PRIMARY ?? 'SERVER_API_KEY_PRIMARY');
    set(config, 'serverApiKey.secondary', process.env.SERVER_API_KEY_SECONDARY ?? 'SERVER_API_KEY_SECONDARY');
    logger.info('Setup config using env vars');
    if (server.locals.ENV !== 'development') {
      propertiesVolume.addTo(config);

      this.setSecret('secrets.dtsse.AppInsightsConnectionString', 'appInsights.instrumentationKey');
      this.setSecret('secrets.dtsse.ardoq-api-key', 'ardoq.apiKey');
      this.setSecret('secrets.dtsse.ardoq-api-url', 'ardoq.apiUrl');
      this.setSecret('secrets.dtsse.ardoq-api-workspace', 'ardoq.apiWorkspace');

      this.setSecret('secrets.dtsse.server-api-key-primary', 'serverApiKey.primary');
      this.setSecret('secrets.dtsse.server-api-key-secondary', 'serverApiKey.secondary');
      logger.info('Setup config using KV secrets');
    }
  }

  private setSecret(fromPath: string, toPath: string): void {
    const logger = Logger.getLogger('properties-volume');
    logger.info('Setting ' + toPath + ' = to ' + fromPath);
    if (config.has(fromPath)) {
      logger.info('Setting ' + toPath + ' = to ' + fromPath + '( *****' + get(config, fromPath).slice(-9) + ' )');
      set(config, toPath, get(config, fromPath));
    }
  }
}
