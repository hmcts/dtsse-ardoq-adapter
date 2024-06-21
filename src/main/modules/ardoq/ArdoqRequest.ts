export interface ArdoqRequest {
  language?: string;
  languageVersion?: string;
  vcsHost: string;
  parser: string;
  hmctsApplication: string;
  codeRepository: string;
  encodedDependencyList: string;
  encodedDependencyListOther?: string | undefined;
}
