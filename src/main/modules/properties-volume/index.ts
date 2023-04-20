import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';
import { Application } from 'express';
import { get, set } from 'lodash';

export class PropertiesVolume {
  enableFor(server: Application): void {
    set(config, 'ardoq.apiKey', process.env.ARDOQ_API_KEY ?? 'ARDOQ_API_KEY');
    set(config, 'ardoq.apiUrl', process.env.ARDOQ_API_URL ?? 'ARDOQ_API_URL');

    set(config, 'ardoq.vcsHostingWorkspace', process.env.ARDOQ_VCS_HOSTING_WORKSPACE ?? 'ARDOQ_VCS_HOSTING_WORKSPACE');
    set(
      config,
      'ardoq.codeRepositoryWorkspace',
      process.env.ARDOQ_CODE_REPOSITORY_WORKSPACE ?? 'ARDOQ_CODE_REPOSITORY_WORKSPACE'
    );
    set(
      config,
      'ardoq.hmctsApplicationsWorkspace',
      process.env.ARDOQ_HMCTS_APPLICATIONS_WORKSPACE ?? 'ARDOQ_HMCTS_APPLICATIONS_WORKSPACE'
    );
    set(
      config,
      'ardoq.softwareFrameworksWorkspace',
      process.env.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE ?? 'ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE'
    );

    set(config, 'serverApiKey.primary', process.env.SERVER_API_KEY_PRIMARY ?? 'SERVER_API_KEY_PRIMARY');
    set(config, 'serverApiKey.secondary', process.env.SERVER_API_KEY_SECONDARY ?? 'SERVER_API_KEY_SECONDARY');

    if (server.locals.ENV !== 'development' && server.locals.ENV !== 'test') {
      propertiesVolume.addTo(config);

      this.setSecret('secrets.dtsse.AppInsightsConnectionString', 'appInsights.instrumentationKey');
      this.setSecret('secrets.dtsse.ardoq-api-key', 'ardoq.apiKey');
      this.setSecret('secrets.dtsse.ardoq-api-url', 'ardoq.apiUrl');

      this.setSecret('secrets.dtsse.vcs-hosting-workspace', 'ardoq.vcsHostingWorkspace');
      this.setSecret('secrets.dtsse.code-repository-workspace', 'ardoq.codeRepositoryWorkspace');
      this.setSecret('secrets.dtsse.hmcts-applications-workspace', 'ardoq.hmctsApplicationsWorkspace');
      this.setSecret('secrets.dtsse.software-frameworks-workspace', 'ardoq.softwareFrameworksWorkspace');

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
