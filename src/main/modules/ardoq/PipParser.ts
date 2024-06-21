import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class PipParser implements IParser {
  public async extractTopTierDeps(depString: string, depStringOther?: string | undefined): Promise<Dependency[]> {
    const pipReqsMatcher = /^([a-zA-Z].+)==(\d+\.\d+\.\d+)$/gm;

    const res = depString.match(pipReqsMatcher);
    if (res === null) {
      return Promise.resolve([]);
    }

    return Promise.resolve(
      res.map(r => {
        const parts = r.split('==');
        return new Dependency(parts[0], parts[1]);
      })
    );
  }
}
