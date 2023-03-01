import { HTTPError } from '../../HttpError';

import { Dependency } from './Dependency';
import { IParser } from './IParser';

import yaml from 'js-yaml';

export class YarnParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
    const deps: Dependency[] = [];
    yaml.loadAll(depString, function (dep: unknown) {
      for (const [key, value] of Object.entries(dep as Record<string, YamlDependency>)) {
        if (key !== '__metadata') {
          if (value.version === undefined) {
            throw new HTTPError(`Failed to parse yarn.lock file. Failed parsing key: ${key} value: ${value}`, 400);
          }
          deps.push(new Dependency(key, value.version));
        }
      }
    });

    return deps;
  }
}

type YamlDependency = {
  version: string;
};
