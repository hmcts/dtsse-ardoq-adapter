import { HTTPError } from '../../HttpError';

import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class DotnetParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
    try {
      const json: DotnetDependency = JSON.parse(depString);

      return json.projects
        .map(p => p.frameworks.map(f => f.topLevelPackages).flat())
        .flat()
        .map(d => new Dependency(d.id, d.resolvedVersion));
    } catch (e) {
      if (e.message === 'Cannot convert undefined or null to object') {
        return [];
      }
      throw new HTTPError(`Failed to parse package-lock.json file. ${e.message}`, 400);
    }
  }
}

type DotnetDependency = {
  projects: {
    frameworks: {
      topLevelPackages: {
        id: string;
        resolvedVersion: string;
      }[];
    }[];
  }[];
};
