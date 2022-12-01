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
}
