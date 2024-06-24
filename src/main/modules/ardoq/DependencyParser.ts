import { ArdoqRequest } from './ArdoqRequest';
import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class DependencyParser {
  constructor(private readonly parser: IParser) {}

  public async fromDepRequest(request: ArdoqRequest): Promise<Record<string, Dependency>> {
    const depString = this.base64Decode(request.encodedDependencyList);
    let depStringOther: string | undefined = undefined;
    if (request.encodedDependencyListOther) {
      depStringOther = this.base64Decode(request.encodedDependencyListOther);
    }
    const deps = await this.parser.extractTopTierDeps(depString, depStringOther);
    if (deps.length === 0) {
      throw new DependencyParserError('No dependencies found in request (found: ' + deps.length + ')');
    }
    const parsedDeps: Record<string, Dependency> = {};
    for (const dep of deps) {
      parsedDeps[dep.name] = dep;
    }
    return parsedDeps;
  }

  private base64Decode(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }
}

export class DependencyParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DependencyParserError';
  }
}
