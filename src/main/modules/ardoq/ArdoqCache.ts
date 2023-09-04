import { ArdoqWorkspaceConfig } from './ArdoqWorkspace';

export class ArdoqCache {
  private caches = new Map<ArdoqWorkspaceConfig, Map<string, string>>([
    [ArdoqWorkspaceConfig.ARDOQ_VCS_HOSTING_WORKSPACE, new Map<string, string>([])],
    [ArdoqWorkspaceConfig.ARDOQ_CODE_REPOSITORY_WORKSPACE, new Map<string, string>([])],
    [ArdoqWorkspaceConfig.ARDOQ_HMCTS_APPLICATIONS_WORKSPACE, new Map<string, string>([])],
    [ArdoqWorkspaceConfig.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE, new Map<string, string>([])],
  ]);

  get(workspace: ArdoqWorkspaceConfig, key: string): string | undefined {
    return this.caches.get(workspace)?.get(key);
  }

  set(workspace: ArdoqWorkspaceConfig, key: string, value: string): void {
    this.caches.get(workspace)?.set(key, value);
  }

  getItemCount(workspace: ArdoqWorkspaceConfig): number {
    return this.caches.get(workspace)?.size ?? 0;
  }

  clear(): void {
    this.caches.forEach(cache => cache.clear());
  }
}
