import { jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { ArdoqClient } from '../../../../main/modules/ardoq/ArdoqClient';
import { RequestProcessor } from '../../../../main/modules/ardoq/RequestProcessor';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { Dependency } from '../../../../main/modules/ardoq/Dependency';
import { ArdoqComponentCreatedResponse } from '../../../../main/modules/ardoq/ArdoqComponentCreatedResponse';
import axios from 'axios';

jest.mock('../../../../main/modules/ardoq/ArdoqClient', () => {
  return {
    ArdoqClient: jest.fn().mockImplementation(() => {
      return {
        updateDep: (d: Dependency) => {
          if (d.name === 'hot-tech') {
            return Promise.resolve(ArdoqComponentCreatedResponse.CREATED);
          }
          if (d.name === '@!££$%^') {
            throw new Error('yoinks');
          }
          return Promise.resolve(ArdoqComponentCreatedResponse.EXISTING);
        },
      };
    }),
  };
});
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RequestProcessor', () => {
  const mockedArdoqClient = mocked(ArdoqClient, { shallow: true });
  const emptyResult: (
    existing: number,
    created: number,
    error: number
  ) => Map<ArdoqComponentCreatedResponse, number> = (existing: number, created: number, error: number) =>
    new Map<ArdoqComponentCreatedResponse, number>([
      [ArdoqComponentCreatedResponse.EXISTING, existing],
      [ArdoqComponentCreatedResponse.CREATED, created],
      [ArdoqComponentCreatedResponse.ERROR, error],
    ]);

  beforeEach(() => {
    // Clears the record of calls to the mock constructor function and its methods
    mockedArdoqClient.mockClear();
  });

  it('Returns a 200 with empty array', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient(mockedAxios, 'a'));
    // @ts-ignore
    requestProcessor.processRequest(new Map<string, Dependency>()).then(res => {
      expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
      expect(res).toEqual(emptyResult(0, 0, 0));
    });
  });

  it('Returns a 200 with existing item', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient(mockedAxios, 'a'));
    // @ts-ignore
    requestProcessor
      .processRequest(new Map<string, Dependency>([['spring 1.1.1', new Dependency('spring', '1.1.1')]]))
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res).toEqual(emptyResult(1, 0, 0));
      });
  });

  it('Returns a 201 with a populated array which creates something in ardoq', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient(mockedAxios, 'a'));
    // @ts-ignore
    requestProcessor
      .processRequest(new Map<string, Dependency>([['hot-tech 1.1.1', new Dependency('hot-tech', '1.1.1')]]))
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res).toEqual(emptyResult(0, 1, 0));
      });
  });

  it('Returns a 400 on error', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient(mockedAxios, 'a'));
    // @ts-ignore
    requestProcessor
      .processRequest(new Map<string, Dependency>([['@!££$%^ 1.1.1', new Dependency('@!££$%^', '1.1.1')]]))
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res).toEqual(emptyResult(0, 0, 0));
      })
      .catch(err => {
        expect(err.message).toBe('yoinks');
      });
  });

  it('Returns a 201 when multiple items with 1 created', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient(mockedAxios, 'a'));
    // @ts-ignore
    requestProcessor
      .processRequest(
        new Map<string, Dependency>([
          ['hot-tech 1.1.1', new Dependency('hot-tech', '1.1.1')],
          ['spring 1.1.1', new Dependency('spring', '1.1.1')],
        ])
      )
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res).toEqual(emptyResult(1, 1, 0));
      });
  });

  it('Returns a 201 when multiple items with 0 created', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient(mockedAxios, 'a'));
    // @ts-ignore
    requestProcessor
      .processRequest(
        new Map<string, Dependency>([
          ['wow 1.1.1', new Dependency('wow', '1.1.1')],
          ['spring 1.1.1', new Dependency('spring', '1.1.1')],
        ])
      )
      .then(res => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(res).toEqual(emptyResult(2, 0, 0));
      });
  });
});
