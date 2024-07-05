import { HTTPError } from '../../HttpError';

import { Dependency } from './Dependency';
import { IParser } from './IParser';

import {
  NodeLockfileVersion,
  getNpmLockfileVersion,
  parseNpmLockV2Project,
  parsePkgJson,
} from 'snyk-nodejs-lockfile-parser';

export class NPMParser implements IParser {
  public async extractTopTierDeps(packageLock: string, packageJson?: string | undefined): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    try {
      const lockVersion = getNpmLockfileVersion(packageLock);

      if (lockVersion == NodeLockfileVersion.NpmLockV1) {
        const json = JSON.parse(packageLock);

        const deps = json.packages
          ? (json.packages as Record<string, NPMDependency>)
          : (json.dependencies as Record<string, NPMDependency>);

        dependencies.push(
          ...Object.entries(deps as Record<string, NPMDependency>)
            .filter(([key]) => key !== '')
            .map(([key, value]) => new Dependency(key, value.version))
        );
      } else {
        if (!packageJson) {
          throw new Error('A value for Package.json is required');
        }
        const lock = await parseNpmLockV2Project(packageJson, packageLock, {
          includeDevDeps: false,
          includeOptionalDeps: false,
          pruneCycles: true,
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
      }
    } catch (e) {
      if (
        ![
          'Cannot convert undefined or null to object',
          'Problem parsing package-lock.json - make sure the package-lock.json is a valid JSON file',
        ].includes(e?.message)
      ) {
        throw new HTTPError(`Failed to parse package-lock.json file. ${e.message}`, 400);
      }
    }
    return dependencies;
  }
}

type NPMDependency = {
  version: string;
};
