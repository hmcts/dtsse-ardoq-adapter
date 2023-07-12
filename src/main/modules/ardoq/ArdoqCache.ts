import { ArdoqWorkspace } from './ArdoqWorkspace';

export class ArdoqCache {
  private caches = new Map<ArdoqWorkspace, Map<string, string>>([
    [ArdoqWorkspace.ARDOQ_VCS_HOSTING_WORKSPACE, new Map<string, string>([])],
    [ArdoqWorkspace.ARDOQ_CODE_REPOSITORY_WORKSPACE, new Map<string, string>([])],
    [ArdoqWorkspace.ARDOQ_HMCTS_APPLICATIONS_WORKSPACE, new Map<string, string>([])],
    [ArdoqWorkspace.ARDOQ_SOFTWARE_FRAMEWORKS_WORKSPACE, new Map<string, string>([])],
  ]);

  get(workspace: ArdoqWorkspace, key: string): string | undefined {
    return this.caches.get(workspace)?.get(key);
  }

  set(workspace: ArdoqWorkspace, key: string, value: string): void {
    this.caches.get(workspace)?.set(key, value);
  }

  getItemCount(workspace: ArdoqWorkspace): number {
    return this.caches.get(workspace)?.size ?? 0;
  }

  clear(): void {
    this.caches.forEach(cache => cache.clear());
  }
}
