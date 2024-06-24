import { ArdoqRequest } from '../../../../main/modules/ardoq/ArdoqRequest';

export function ardoqRequest(body: Partial<ArdoqRequest>, parser: string = 'gradle'): ArdoqRequest {
  let template: ArdoqRequest = {
    language: 'node',
    languageVersion: '18-alpine',
    vcsHost: 'Github HMCTS',
    parser,
    hmctsApplication: 'c365c1b0-233a-4bba-92ed-0830983e6c0a',
    codeRepository: 'foo-bat',
    encodedDependencyList: '',
  };
  template = Object.assign(template, body);
  if (template.encodedDependencyList) {
    template.encodedDependencyList = Buffer.from(template.encodedDependencyList).toString('base64');
  }
  if (template.encodedDependencyListOther) {
    template.encodedDependencyListOther = Buffer.from(template.encodedDependencyListOther).toString('base64');
  }
  return template;
}

export function base64Encode(str: string): string {
  return Buffer.from(str, 'binary').toString('base64');
}
