import { Dependency } from './Dependency';

export class GradleParser {
  public static fromDepString(depString: string): Map<string, Dependency> {
    const deps = GradleParser.extractTopTierDeps(depString);
    if (deps.length === 0) {
      throw new Error('No dependencies found');
    }
    const parsedDeps: Map<string, Dependency> = new Map<string, Dependency>();
    deps.forEach(line => {
      const d = Dependency.fromDepString(line);
      parsedDeps.set(d.getFullName(), d);
    });
    return parsedDeps;
  }

  public static extractTopTierDeps(depString: string): RegExpMatchArray {
    const rx = /^\+.+/gm;
    const res = depString.match(rx);
    const semverRx = /^.+:.+:.+\$/;
    if (res === null) {
      return [];
    }
    return res
      .map(d => d.substring(5).replace(/ -> /g, ':'))
      .filter(d => !d.match(semverRx))
      .map(d => d.replace(/(.*):/, '$1 -> '))
      .filter(d => d !== 'unspecified (n)')
      .map(d => d.replace(/ \(\*\)/, ''));
  }
}
