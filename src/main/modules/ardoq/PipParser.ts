import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class PipParser implements IParser {
  public extractTopTierDeps(depString: string): Dependency[] {
    const pipReqsMatcher = /^([a-zA-z].+)==(\d+\.\d+\.\d+)$/gm;

    const res = depString.match(pipReqsMatcher);
    if (res === null) {
      return [];
    }

    return res.map(r => {
      const parts = r.split('==');
      return new Dependency(parts[0], parts[1]);
    });
  }
}
