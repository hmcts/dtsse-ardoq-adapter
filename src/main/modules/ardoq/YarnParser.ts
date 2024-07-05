import { Dependency } from './Dependency';
import { IParser } from './IParser';

import { parsePkgJson, parseYarnLockV2Project } from 'snyk-nodejs-lockfile-parser';

export class YarnParser implements IParser {
  public async extractTopTierDeps(yarnLockFile: string, packageJson?: string | undefined): Promise<Dependency[]> {
    if (!packageJson) {
      throw new Error('A value for Package.json is required');
    }

    const dependencies: Dependency[] = [];
    const lock = await parseYarnLockV2Project(packageJson, yarnLockFile, {
      includeDevDeps: false,
      includeOptionalDeps: false,
      pruneWithinTopLevelDeps: true,
      strictOutOfSync: true,
    });
    const pkgParsed = parsePkgJson(packageJson);
    if (pkgParsed.dependencies) {
      const pkgNames = Object.keys(pkgParsed.dependencies);
      const pkgs = lock.getDepPkgs();

      for (const pkgName of pkgNames) {
        const pkg = pkgs.find(p => p.name == pkgName);
        if (pkg?.version) {
          dependencies.push(new Dependency(pkg.name, pkg.version));
        }
      }
    }

    return dependencies;
  }
}
