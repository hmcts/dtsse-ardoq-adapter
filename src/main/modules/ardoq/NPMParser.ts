import { HTTPError } from '../../HttpError';

import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class NPMParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
    try {
      const json = JSON.parse(depString);

      const deps = json.packages
        ? (json.packages as Record<string, NPMDependency>)
        : (json.dependencies as Record<string, NPMDependency>);

      return Object.entries(deps as Record<string, NPMDependency>)
        .filter(([key]) => key !== '')
        .map(([key, value]) => new Dependency(key, value.version));
    } catch (e) {
      if (e.message === 'Cannot convert undefined or null to object') {
        return [];
      }
      throw new HTTPError(`Failed to parse package-lock.json file. ${e.message}`, 400);
    }
  }
}

type NPMDependency = {
  version: string;
};
