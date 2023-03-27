import { ArdoqRequest } from './ArdoqRequest';
import { Dependency } from './Dependency';
import { IParser } from './IParser';

export class DependencyParser {
  constructor(private readonly parser: IParser) {}

  public fromDepRequest(request: ArdoqRequest): Map<string, Dependency> {
    const deps = this.parser.extractTopTierDeps(this.base64Decode(request.encodedDependecyList));
    if (deps.length === 0) {
      throw new DependencyParserError('No dependencies found in request');
    }
    const parsedDeps: Map<string, Dependency> = new Map<string, Dependency>();
    deps.forEach(d => {
      parsedDeps.set(d.name, d);
    });
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
