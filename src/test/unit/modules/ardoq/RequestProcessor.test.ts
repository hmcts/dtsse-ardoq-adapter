import { jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { ArdoqClient } from '../../../../main/modules/ardoq/ArdoqClient';
import { BatchRequest } from '../../../../main/modules/ardoq/batch/BatchRequest';
import { RequestProcessor } from '../../../../main/modules/ardoq/RequestProcessor';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { Dependency } from '../../../../main/modules/ardoq/Dependency';
import { ArdoqComponentCreatedStatus } from '../../../../main/modules/ardoq/ArdoqComponentCreatedStatus';
import axios from 'axios';
import { DependencyParser } from '../../../../main/modules/ardoq/DependencyParser';
import { GradleParser } from '../../../../main/modules/ardoq/GradleParser';
import { ArdoqRelationship } from '../../../../main/modules/ardoq/ArdoqRelationship';
import { base64Encode } from './TestUtility';

jest.mock('../../../../main/modules/ardoq/ArdoqClient', () => {
  return {
    ArdoqClient: jest.fn().mockImplementation(() => {
      return {
        updateDep: (d: Dependency) => {
          if (d.name === 'hot-tech') {
            return Promise.resolve([ArdoqComponentCreatedStatus.CREATED, '123']);
          }
          if (d.name === '@!££$%^') {
            throw new Error('yoinks');
          }
          return Promise.resolve([ArdoqComponentCreatedStatus.EXISTING, '456']);
        },
        createVcsHostingComponent(name: string): Promise<string | null> {
          return Promise.resolve('abc');
        },
        createCodeRepoComponent(name: string): Promise<string | null> {
          return Promise.resolve('def');
        },
        referenceRequest(source: string, target: string, relationship: ArdoqRelationship, version?: string): void {},
        processBatchRequest(
          batchRequest: BatchRequest,
          counts: Map<ArdoqComponentCreatedStatus, number>
        ): Promise<Map<ArdoqComponentCreatedStatus, number>> {
          return Promise.resolve(counts);
        },
      };
    }),
  };
});
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RequestProcessor', () => {
  const cache = new Map<string, Dependency>();
  const mockedArdoqClient = mocked(ArdoqClient, { shallow: true });
  const emptyResult: (existing: number, created: number, error: number) => Map<ArdoqComponentCreatedStatus, number> = (
    existing: number,
    created: number,
    error: number
  ) =>
    new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.EXISTING, existing],
      [ArdoqComponentCreatedStatus.CREATED, created],
      [ArdoqComponentCreatedStatus.ERROR, error],
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
        expect(err.message).toBe('No dependencies found in request');
      });
  });

  it('Returns a 200 with existing item', () => {
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
        encodedDependecyList: base64Encode('+--- spring:1.1.1'),
      })
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res).toEqual(emptyResult(1, 0, 0));
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
        expect(res).toEqual(emptyResult(0, 1, 0));
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
        expect(res).toEqual(emptyResult(0, 0, 0));
      })
      .catch(err => {
        expect(err.message).toBe('No dependencies found in request');
      });
  });

  it('Returns a 201 when multiple items with 1 created', () => {
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
        expect(res).toEqual(emptyResult(1, 1, 0));
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
        expect(res).toEqual(emptyResult(2, 0, 0));
      });
  });
});
