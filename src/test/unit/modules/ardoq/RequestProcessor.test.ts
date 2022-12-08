import { jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { Response } from 'express';
import { ArdoqClient } from '../../../../main/modules/ardoq/ArdoqClient';
import { RequestProcessor } from '../../../../main/modules/ardoq/RequestProcessor';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { Dependency } from '../../../../main/modules/ardoq/Dependency';
import { ArdoqComponentCreatedResponse } from '../../../../main/modules/ardoq/ArdoqComponentCreatedResponse';

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

const mockRes = {
  // mock props, methods you use
  setHeader: jest.fn(),
  contentType: jest.fn(),
  send: jest.fn(),
} as unknown as Response;

describe('RequestProcessor', () => {
  const mockedArdoqClient = mocked(ArdoqClient, { shallow: true });

  beforeEach(() => {
    // Clears the record of calls to the mock constructor function and its methods
    mockedArdoqClient.mockClear();
  });

  it('Returns a 200 with empty array', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient('a'));
    // @ts-ignore
    requestProcessor.processRequest(mockRes, new Map<string, Dependency>()).then(_ => {
      expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
      expect(mockRes.statusCode).toEqual(200);
      expect(mockRes.send).toHaveBeenCalledTimes(1);
    });
  });

  it('Returns a 200 with existing item', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient('a'));
    // @ts-ignore
    requestProcessor
      .processRequest(mockRes, new Map<string, Dependency>([['spring 1.1.1', new Dependency('spring', '1.1.1')]]))
      .then(_ => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(mockRes.statusCode).toEqual(200);
        expect(mockRes.send).toHaveBeenCalledTimes(2);
      });
  });

  it('Returns a 201 with a populated array which creates something in ardoq', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient('a'));
    // @ts-ignore
    requestProcessor
      .processRequest(mockRes, new Map<string, Dependency>([['hot-tech 1.1.1', new Dependency('hot-tech', '1.1.1')]]))
      .then(_ => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(mockRes.statusCode).toEqual(201);
        expect(mockRes.send).toHaveBeenCalledTimes(3);
      });
  });

  it('Returns a 400 on error', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient('a'));
    // @ts-ignore
    requestProcessor
      .processRequest(mockRes, new Map<string, Dependency>([['@!££$%^ 1.1.1', new Dependency('@!££$%^', '1.1.1')]]))
      .then(_ => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(mockRes.statusCode).toEqual(400);
        expect(mockRes.send).toHaveBeenCalledTimes(4);
      });
  });

  it('Returns a 201 when multiple items with 1 created', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient('a'));
    // @ts-ignore
    requestProcessor
      .processRequest(
        mockRes,
        new Map<string, Dependency>([
          ['hot-tech 1.1.1', new Dependency('hot-tech', '1.1.1')],
          ['spring 1.1.1', new Dependency('spring', '1.1.1')],
        ])
      )
      .then(_ => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(mockRes.statusCode).toEqual(201);
        expect(mockRes.send).toHaveBeenCalledTimes(5);
      });
  });

  it('Returns a 201 when multiple items with 0 created', () => {
    const requestProcessor = new RequestProcessor(new mockedArdoqClient('a'));
    // @ts-ignore
    requestProcessor
      .processRequest(
        mockRes,
        new Map<string, Dependency>([
          ['wow 1.1.1', new Dependency('wow', '1.1.1')],
          ['spring 1.1.1', new Dependency('spring', '1.1.1')],
        ])
      )
      .then(_ => {
        expect(mockedArdoqClient).toHaveBeenCalledTimes(1);
        expect(mockRes.statusCode).toEqual(200);
        expect(mockRes.send).toHaveBeenCalledTimes(6);
      });
  });
});
