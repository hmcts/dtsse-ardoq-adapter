import { Dependency } from './Dependency';

export class MavenParser {
  public static fromDepString(depString: string): Map<string, Dependency> {
    const deps = MavenParser.extractTopTierDeps(depString);
    if (deps.length === 0) {
      throw new Error('No dependencies found');
    }
    const parsedDeps: Map<string, Dependency> = new Map<string, Dependency>();
    deps.forEach(d => {
      parsedDeps.set(d.getFullName(), d);
    });
    return parsedDeps;
  }

  public static extractTopTierDeps(depString: string): Dependency[] {
    const rx = /^\[INFO] \+.+/gm;
    const mvnDepMatcher = /^[.\d\-a-z]+:[.\d\-a-z]+:[a-z]+:[.\d\-a-z]:[a-z]+\$/;

    const res = depString.match(rx);
    if (res === null) {
      return [];
    }
    return res
      .map(d => d.substring(10))
      .filter(d => !d.match(mvnDepMatcher))
      .map(d => {
        const parts = d.split(':');
        return new Dependency(parts[0] + ':' + parts[1], parts[3]);
      });
  }
}
