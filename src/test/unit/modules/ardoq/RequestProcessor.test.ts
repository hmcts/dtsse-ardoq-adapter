import { jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { app } from '../../../../main/app';
import { ArdoqCache } from '../../../../main/modules/ardoq/ArdoqCache';
import { ArdoqClient } from '../../../../main/modules/ardoq/ArdoqClient';
import { ArdoqRelationship } from '../../../../main/modules/ardoq/ArdoqRelationship';
import { ArdoqStatusCounts } from '../../../../main/modules/ardoq/ArdoqStatusCounts';
import { ArdoqWorkspace } from '../../../../main/modules/ardoq/ArdoqWorkspace';
import { BatchCreate, BatchUpdate } from '../../../../main/modules/ardoq/batch/BatchModel';
import { BatchRequest } from '../../../../main/modules/ardoq/batch/BatchRequest';
import { SearchReferenceResponse } from '../../../../main/modules/ardoq/repositories/ArdoqReferenceRepository';
import { RequestProcessor } from '../../../../main/modules/ardoq/RequestProcessor';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { ArdoqComponentCreatedStatus } from '../../../../main/modules/ardoq/ArdoqComponentCreatedStatus';
import axios from 'axios';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { GradleParser } from '../../../../main/modules/ardoq/GradleParser';
import { PropertiesVolume } from '../../../../main/modules/properties-volume';
import { base64Encode } from './TestUtility';

jest.mock('../../../../main/modules/ardoq/ArdoqClient', () => {
  return {
    ArdoqClient: jest.fn().mockImplementation(() => {
      return {
        getComponentIdIfExists: (name: string) => {
          if (name === 'hot-tech') {
            return Promise.resolve(null);
          }
          if (name === '@!££$%^') {
            throw new Error('yoinks');
          }
          return Promise.resolve('456');
        },
        createVcsHostingComponent(name: string): Promise<string | null> {
          return Promise.resolve('abc');
        },
        createCodeRepoComponent(name: string): Promise<string | null> {
          return Promise.resolve('def');
        },
        getOrCreateComponent(
          name: string,
          ardoqWorkspace: ArdoqWorkspace
        ): Promise<[ArdoqComponentCreatedStatus, string | null]> {
          if (name === 'java') {
            return Promise.resolve([ArdoqComponentCreatedStatus.EXISTING, 'java123']);
          }
          return Promise.resolve([ArdoqComponentCreatedStatus.EXISTING, 'java123']);
        },
        searchForReference(source: string, target: string): Promise<undefined | SearchReferenceResponse> {
          if (source === 'def' && target === '456') {
            return Promise.resolve({
              id: '123',
              version: '0.0.1',
              name: 'name123',
            });
          }
          if (source === 'e' && target === '456') {
            return Promise.resolve({
              id: '456',
              version: '1.1.1',
              name: 'name456',
            });
          }
          return Promise.resolve(undefined);
        },
        processBatchRequest(batchRequest: BatchRequest): Promise<ArdoqStatusCounts> {
          return Promise.resolve(new ArdoqStatusCounts());
        },
        getCreateOrUpdateReferenceModel(
          existingReference: SearchReferenceResponse | undefined,
          source: string,
          target: string,
          relationship: ArdoqRelationship,
          version?: string,
          name?: string
        ): Promise<BatchCreate | BatchUpdate | undefined> {
          if (source == 'def') {
            return Promise.resolve({
              body: {
                source,
                target,
                type: relationship,
                customFields: version ? { sf_version: version, reference_target: name } : undefined,
              },
            } as BatchCreate);
          } else if (source === 'java123') {
            return Promise.resolve({
              id: 'ref123',
              ifVersionMatch: 'latest',
              body: {
                source,
                target,
                type: relationship,
                customFields: { sf_version: version, reference_target: name },
              },
            } as BatchUpdate);
          }
          return Promise.resolve(undefined);
        },
        getCreateOrUpdateDependencyReferenceModel(
          existingReference: SearchReferenceResponse | undefined,
          source: string,
          target: string,
          relationship: ArdoqRelationship,
          version?: string,
          name?: string
        ): Promise<BatchCreate | BatchUpdate | undefined> {
          if (source == 'def') {
            return Promise.resolve({
              body: {
                source,
                target,
                type: relationship,
                customFields: version ? { sf_version: version, reference_target: name } : undefined,
              },
            } as BatchCreate);
          } else if (source === 'java123') {
            return Promise.resolve({
              id: 'ref123',
              ifVersionMatch: 'latest',
              body: {
                source,
                target,
                type: relationship,
                customFields: { sf_version: version, reference_target: name },
              },
            } as BatchUpdate);
          }
          return Promise.resolve(undefined);
        },
        getAllReferencesForRepository(repo: string): Promise<Map<string, SearchReferenceResponse>> {
          return Promise.resolve(new Map<string, SearchReferenceResponse>());
        },
      };
    }),
  };
});
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RequestProcessor', () => {
  new PropertiesVolume().enableFor(app);
  const cache = new ArdoqCache();
  const mockedArdoqClient = mocked(ArdoqClient, { shallow: true });
  const emptyResult: (
    existing: number,
    created: number,
    error: number,
    pending: number
  ) => Map<ArdoqComponentCreatedStatus, number> = (existing: number, created: number, error: number, pending: number) =>
    new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.EXISTING, existing],
      [ArdoqComponentCreatedStatus.CREATED, created],
      [ArdoqComponentCreatedStatus.ERROR, error],
      [ArdoqComponentCreatedStatus.PENDING, pending],
    ]);

  beforeEach(() => {
    // Clears the record of calls to the mock constructor function and its methods
    mockedArdoqClient.mockClear();
  });

  it('Returns a 200 with empty array', () => {
    const requestProcessor = new RequestProcessor(
      new mockedArdoqClient(mockedAxios, cache),
      new DependencyParser(new GradleParser())
    );
    requestProcessor
      .processRequest({
        vcsHost: 'github.com/hmcts',
        parser: 'gradle',
        hmctsApplication: 'dtsse',
        codeRepository: 'dtsse-ardoq-adapter',
        encodedDependecyList: '',
      })
      .catch(err => {
        expect(err.message).toBe('No dependencies found in request (found: 0)');
      });
  });

  it('Returns a 200 with existing item', () => {
    const requestProcessor = new RequestProcessor(
      new mockedArdoqClient(mockedAxios, cache),
      new DependencyParser(new GradleParser())
    );

    requestProcessor
      .processRequest({
        language: 'java',
        languageVersion: '17-distroless',
        vcsHost: 'github.com/hmcts',
        parser: 'gradle',
        hmctsApplication: 'dtsse',
        codeRepository: 'dtsse-ardoq-adapter',
        encodedDependecyList: base64Encode('+--- spring:1.1.1'),
      })
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res.counts).toEqual(emptyResult(1, 0, 0, 0));
      });
  });

  it('Returns a 201 with a populated array which creates something in ardoq', () => {
    const requestProcessor = new RequestProcessor(
      new mockedArdoqClient(mockedAxios, cache),
      new DependencyParser(new GradleParser())
    );

    requestProcessor
      .processRequest({
        vcsHost: 'github.com/hmcts',
        parser: 'gradle',
        hmctsApplication: 'dtsse',
        codeRepository: 'dtsse-ardoq-adapter',
        encodedDependecyList: base64Encode('+--- hot-tech:1.1.1\n'),
      })
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res.counts).toEqual(emptyResult(0, 0, 0, 1));
      });
  });

  it('Returns a 400 on error', () => {
    const requestProcessor = new RequestProcessor(
      new mockedArdoqClient(mockedAxios, cache),
      new DependencyParser(new GradleParser())
    );

    requestProcessor
      .processRequest({
        vcsHost: 'github.com/hmcts',
        parser: 'gradle',
        hmctsApplication: 'dtsse',
        codeRepository: 'dtsse-ardoq-adapter',
        encodedDependecyList: base64Encode('+--- @!££$%^:1.1.1\n'),
      })
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res.counts).toEqual(emptyResult(0, 0, 0, 0));
      })
      .catch(err => {
        expect(err.message).toBe('No dependencies found in request (found: 0)');
      });
  });

  it('Returns a 201 when at least 1 item created', () => {
    const requestProcessor = new RequestProcessor(
      new mockedArdoqClient(mockedAxios, cache),
      new DependencyParser(new GradleParser())
    );

    requestProcessor
      .processRequest({
        vcsHost: 'github.com/hmcts',
        parser: 'gradle',
        hmctsApplication: 'dtsse',
        codeRepository: 'dtsse-ardoq-adapter',
        encodedDependecyList: base64Encode('+--- hot-tech:1.1.1\n' + '+--- spring:1.1.1\n'),
      })
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res.counts).toEqual(emptyResult(1, 0, 0, 1));
      });
  });

  it('Returns a 201 when multiple items with 0 created', () => {
    const requestProcessor = new RequestProcessor(
      new mockedArdoqClient(mockedAxios, cache),
      new DependencyParser(new GradleParser())
    );
    // @ts-ignore
    requestProcessor
      .processRequest({
        vcsHost: 'github.com/hmcts',
        parser: 'gradle',
        hmctsApplication: 'dtsse',
        codeRepository: 'dtsse-ardoq-adapter',
        encodedDependecyList: base64Encode('+--- wow:1.1.1\n' + '+--- spring:1.1.1\n'),
      })
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res.counts).toEqual(emptyResult(2, 0, 0, 0));
      });
  });
});
