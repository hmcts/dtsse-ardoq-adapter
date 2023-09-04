import config from 'config';

export const enum ArdoqWorkspaceConfig {
  ARDOQ_VCS_HOSTING_WORKSPACE = 'ardoq.vcsHostingWorkspace',
  ARDOQ_CODE_REPOSITORY_WORKSPACE = 'ardoq.codeRepositoryWorkspace',
  ARDOQ_HMCTS_APPLICATIONS_WORKSPACE = 'ardoq.hmctsApplicationsWorkspace',
  ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE = 'ardoq.softwareFrameworksWorkspace',
}

export type ArdoqWorkspaceId = string;

export class ArdoqWorkspace {
  private workspace: ArdoqWorkspaceConfig;
  constructor(workspace: ArdoqWorkspaceConfig) {
    this.workspace = workspace;
  }

  getId(): ArdoqWorkspaceId {
    return config.get(this.workspace.toString());
  }
}
