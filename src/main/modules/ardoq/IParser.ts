import { Dependency } from './Dependency';

export interface IParser {
  extractTopTierDeps: (depString: string, depStringOther?: string | undefined) => Promise<Dependency[]>;
}
