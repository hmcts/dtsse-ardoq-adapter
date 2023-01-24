import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class MavenParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
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
