import { Dependency } from './Dependency';

export class GradleParser {
  public static fromDepString(depString: string): Map<string, Dependency> {
    const deps = GradleParser.extractTopTierDeps(depString);
    if (deps.length === 0) {
      throw new Error('No dependencies found');
    }
    const parsedDeps: Map<string, Dependency> = new Map<string, Dependency>();
    deps.forEach(d => {
      parsedDeps.set(d.getFullName(), d);
    });
    return parsedDeps;
  }

  public static getDependency(depString: string): Dependency {
    const parts = depString.split(' -> ');
    if (parts.length !== 2) {
      throw new Error('Dependency string ' + depString + ' is malformed. Should match <name> -> <version>');
    }
    return new Dependency(parts[0].trim(), parts[1].trim());
  }

  public static extractTopTierDeps(depString: string): Dependency[] {
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
      .map(d => GradleParser.getDependency(d.replace(/ \(\*\)/, '')));
  }
}
