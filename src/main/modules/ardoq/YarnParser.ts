import { HTTPError } from '../../HttpError';

import { Dependency } from './Dependency';
import { IParser } from './IParser';

import yaml from 'js-yaml';

export class YarnParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
    const doc = yaml.load(depString) as Record<string, YamlDependency>;

    try {
      return Object.entries(doc)
        .filter(([key]) => key !== '__metadata')
        .map(([key, value]) => {
          if (value.version === undefined) {
            throw new HTTPError(`Failed to parse yarn.lock file. Failed parsing key: ${key} value: ${value}`, 400);
          }
          return new Dependency(key, value.version);
        });
    } catch (e) {
      if (e.message === 'Cannot convert undefined or null to object') {
        return [];
      }
      throw new HTTPError(`Failed to parse yarn.lock file. ${e.message}`, 400);
    }
  }
}

type YamlDependency = {
  version: string;
};
