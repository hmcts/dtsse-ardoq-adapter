export class Dependency {
  name: string;
  version: string;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }

  getFullName(): string {
    return this.name + ' ' + this.version;
  }

  public static fromDepString(depString: string): Dependency {
    const parts = depString.split(' -> ');
    if (parts.length !== 2) {
      throw new Error('Dependency string ' + depString + ' is malformed. Should match <name> -> <version>');
    }
    return new Dependency(parts[0].trim(), parts[1].trim());
  }
}
