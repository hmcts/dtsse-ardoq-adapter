import { ArdoqRequest } from '../../../../main/modules/ardoq/ArdoqRequest';

export function ardoqRequest(body: string, parser: string = 'gradle', base64Encode: boolean = true): ArdoqRequest {
  return {
    language: 'node',
    languageVersion: '18-alpine',
    vcsHost: 'Github HMCTS',
    parser: parser,
    hmctsApplication: 'c365c1b0-233a-4bba-92ed-0830983e6c0a',
    codeRepository: 'foo-bat',
    encodedDependecyList: base64Encode ? Buffer.from(body).toString('base64') : body,
  };
}

export function base64Encode(str: string): string {
  return Buffer.from(str, 'binary').toString('base64');
}
