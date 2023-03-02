import { HTTPError } from '../../HttpError';

import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class NPMParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
    const json = JSON.parse(depString);

    try {
      return Object.entries(json.packages as Record<string, NPMDependency>)
        .filter(([key]) => key !== '')
        .map(([key, value]) => {
          return new Dependency(key, value.version);
        });
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
