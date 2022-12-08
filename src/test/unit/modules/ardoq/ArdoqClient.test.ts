import axios from 'axios';
import { jest } from '@jest/globals';
import { describe, expect, it } from '@jest/globals';

import { ArdoqClient } from '../../../../main/modules/ardoq/ArdoqClient';
import { Dependency } from '../../../../main/modules/ardoq/Dependency';
import { ArdoqComponentCreatedResponse } from '../../../../main/modules/ardoq/ArdoqComponentCreatedResponse';

jest.mock('axios');

describe('ArdoqClient', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  // @ts-ignore
  mockedAxios.get.mockImplementation((url: string, config: object) => {
    // @ts-ignore
    if (config.params.name === 'hot-tech 1.1.1' || config.params.name === 'hot-tech 2.0.0') {
      return Promise.resolve({
        status: 200,
        data: '[]',
      });
      // @ts-ignore
    } else if (config.params.name === '@!££$%^ 1.1.1') {
      return Promise.resolve({
        status: 500,
        data: '',
      });
    } else {
      return Promise.resolve({
        status: 200,
        data: '[literally anything right now]',
      });
    }
  });
  // @ts-ignore
  mockedAxios.post.mockImplementation((url: string, data: object, config: object) => {
    // @ts-ignore
    if (config.params.name === 'hot-tech 1.1.1') {
      return Promise.resolve({
        status: 201,
      });
    }
    return Promise.resolve({
      status: 500,
    });
  });

  it('Returns a CREATED response', () => {
    const client = new ArdoqClient('a');
    client.updateDep(new Dependency('hot-tech', '1.1.1')).then(result => {
      expect(result).toEqual(ArdoqComponentCreatedResponse.CREATED);
    });
  });

  it('Returns an ERROR response', () => {
    const client = new ArdoqClient('a');
    client.updateDep(new Dependency('@!££$%^', '1.1.1')).then(result => {
      expect(result).toEqual(ArdoqComponentCreatedResponse.ERROR);
    });
  });

  it('Returns an EXISTING response', () => {
    const client = new ArdoqClient('a');
    client.updateDep(new Dependency('hot-tech', '2.2.2')).then(result => {
      expect(result).toEqual(ArdoqComponentCreatedResponse.EXISTING);

      // should now use a cached result
      client.updateDep(new Dependency('hot-tech', '2.2.2')).then(result => {
        expect(result).toEqual(ArdoqComponentCreatedResponse.EXISTING);
      });
    });
  });

  it('Returns an ERROR response', () => {
    const client = new ArdoqClient('a');
    client.updateDep(new Dependency('hot-tech', '2.0.0')).then(result => {
      expect(result).toEqual(ArdoqComponentCreatedResponse.ERROR);
    });
  });
});
