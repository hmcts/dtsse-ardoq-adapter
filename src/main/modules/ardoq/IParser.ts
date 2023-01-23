import { Dependency } from './Dependency';

export interface IParser {
  extractTopTierDeps: (depString: string) => Dependency[];
}
