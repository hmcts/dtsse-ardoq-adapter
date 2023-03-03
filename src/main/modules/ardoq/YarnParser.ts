import { Dependency } from './Dependency';
import { IParser } from './IParser';

import yaml from 'js-yaml';

const { Logger } = require('@hmcts/nodejs-logging');

export class YarnParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
    const doc = yaml.load(depString) as Record<string, YamlDependency>;

    const logger = Logger.getLogger('YarnParser');

    try {
      return Object.entries(doc)
        .filter(([key, value]) => {
          if (key === '__metadata') {
            return false;
          }
          if (value.version === undefined) {
            logger.warn(`Failed to parse yarn.lock file. Failed parsing key: ${key} value: ${value}`);
            return false;
          }
          return true;
        })
        .map(([key, value]) => new Dependency(key, value.version));
    } catch (e) {
      if (e.message === 'Cannot convert undefined or null to object') {
        return [];
      }
      throw e;
    }
  }
}

type YamlDependency = {
  version: string;
};
