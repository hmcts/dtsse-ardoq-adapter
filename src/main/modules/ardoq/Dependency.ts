export class Dependency {
  name: string;
  version: string;
  componentId: string | null;

  constructor(name: string, version: string, componentId: string | null = null) {
    this.name = name;
    this.version = version;
    this.componentId = componentId;
  }

  equals(other: Dependency): boolean {
    return this.name === other.name;
  }
}
