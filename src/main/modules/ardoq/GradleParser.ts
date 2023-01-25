import { HTTPError } from '../../HttpError';

import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class GradleParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
    const rx = /^\+.+/gm;
    const res = depString.match(rx);
    const semverRx = /^[.\d\-a-z]+:[.\d\-a-z]+:[.\d\-a-z]+\$/;
    if (res === null) {
      return [];
    }
    return res
      .map(d => d.substring(5).replace(/ -> /g, ':'))
      .filter(d => !d.match(semverRx))
      .map(d => d.replace(/^([.\d\-a-z:]+):/, '$1 -> '))
      .filter(d => d !== 'unspecified (n)')
      .map(d => this.getDependency(d.replace(/ \(([*n])\)/, '')));
  }

  public getDependency(depString: string): Dependency {
    const parts = depString.split(' -> ');
    if (parts.length !== 2) {
      throw new HTTPError('Dependency string ' + depString + ' is malformed. Should match <name> -> <version>', 400);
    }
    return new Dependency(parts[0].trim(), parts[1].trim());
  }
}
