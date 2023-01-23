import { HTTPError } from '../../HttpError';

import { Dependency } from './Dependency';

export abstract class DependencyParser {
  public fromDepString(depString: string): Map<string, Dependency> {
    const deps = this.extractTopTierDeps(depString);
    if (deps.length === 0) {
      throw new HTTPError('No dependencies found in request', 400);
    }
    const parsedDeps: Map<string, Dependency> = new Map<string, Dependency>();
    deps.forEach(d => {
      parsedDeps.set(d.getFullName(), d);
    });
    return parsedDeps;
  }

  public abstract extractTopTierDeps(depString: string): Dependency[];
}
