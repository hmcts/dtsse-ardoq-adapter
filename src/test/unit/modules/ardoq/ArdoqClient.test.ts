import axios from 'axios';
import { jest } from '@jest/globals';
import { describe, expect, it } from '@jest/globals';

import { ArdoqClient } from '../../../../main/modules/ardoq/ArdoqClient';
import { BatchRequest } from '../../../../main/modules/ardoq/batch/BatchRequest';
import { Dependency } from '../../../../main/modules/ardoq/Dependency';
import { ArdoqComponentCreatedStatus } from '../../../../main/modules/ardoq/ArdoqComponentCreatedStatus';
import { PropertiesVolume } from '../../../../main/modules/properties-volume';
import { app } from '../../../../main/app';

jest.mock('axios');

describe('ArdoqClient', () => {
  new PropertiesVolume().enableFor(app);

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  // @ts-ignore
  mockedAxios.get.mockImplementation((url: string, config: object) => {
    if (url.startsWith('/api/v2/references')) {
      return Promise.resolve({
        status: 200,
        data: {
          values: [],
        },
      });
    }
    // @ts-ignore
    const paramName = config.params.name;
    if (paramName === 'hot-tech2') {
      return Promise.resolve({
        status: 200,
        data: {
          values: [{ _id: '1234' }],
        },
      });
    }
    if (paramName === '@!££$%^') {
      return Promise.resolve({
        status: 500,
        data: '',
      });
    }
    if (paramName === 'dtsse-ardoq-adapter') {
      return Promise.resolve({
        status: 404,
        data: '',
      });
    }
    if (paramName === 'github.com/hmcts') {
      return Promise.resolve({
        status: 200,
        data: {
          values: [
            {
              _id: '5678',
            },
          ],
        },
      });
    }
    if (paramName === 'github.com/blah') {
      return Promise.resolve({
        status: 500,
        data: {
          values: [],
        },
      });
    }

    if (paramName === 'known-but-not-cached') {
      return Promise.resolve({
        status: 200,
        data: {
          values: [
            {
              _id: '91011',
            },
          ],
        },
      });
    }

    return Promise.resolve({
      status: 200,
      data: {
        values: [],
      },
    });
  });
  // @ts-ignore
  mockedAxios.post.mockImplementation((url: string, data: string, config: object) => {
    if (url === '/api/v2/batch') {
      const d = JSON.parse(data);
      if (d['component']['create'][0]['body']['name'] == '@!££$%^') {
        return Promise.resolve({
          status: 500,
        });
      }
      if (d['component']['create'][0]['body']['name'] == 'hot-tech') {
        return Promise.resolve({
          status: 200,
          data: {
            components: {
              created: [
                {
                  id: '1234',
                  body: {
                    name: 'hot-tech',
                  },
                },
              ],
            },
          },
        });
      }
    }
    // @ts-ignore
    const paramName = config.params.name;
    if (paramName === 'hot-tech') {
      return Promise.resolve({
        status: 201,
        data: {
          _id: '1234',
        },
      });
    }
    if (paramName === 'dtsse-ardoq-adapter') {
      return Promise.resolve({
        status: 201,
        data: {
          _id: '1234',
        },
      });
    }
    return Promise.resolve({
      status: 500,
    });
  });

  const cache = new Map<string, Dependency>();
  const counts = () => {
    return new Map<ArdoqComponentCreatedStatus, number>([
      [ArdoqComponentCreatedStatus.EXISTING, 0],
      [ArdoqComponentCreatedStatus.CREATED, 0],
      [ArdoqComponentCreatedStatus.ERROR, 0],
    ]);
  };

  it('Returns a CREATED response', () => {
    const client = new ArdoqClient(mockedAxios, cache);
    const br = new BatchRequest();
    client.updateDep(new Dependency('hot-tech', '1.1.1'), br).then(result => {
      expect(result[0]).toEqual(ArdoqComponentCreatedStatus.PENDING);
      expect(br.component.getCreateLength()).toEqual(1);
      const c = counts();
      client.processBatchRequest(br, c).then(result => {
        expect(c.get(ArdoqComponentCreatedStatus.CREATED)).toEqual(1);
      });
    });
  });

  it('Returns an ERROR response', () => {
    const client = new ArdoqClient(mockedAxios, cache);
    const br = new BatchRequest();
    client.updateDep(new Dependency('@!££$%^', '1.1.1'), br).then(result => {
      expect(result[0]).toEqual(ArdoqComponentCreatedStatus.PENDING);
      expect(br.component.getCreateLength()).toEqual(1);
      const c = counts();
      client.processBatchRequest(br, c).then(result => {
        expect(c.get(ArdoqComponentCreatedStatus.ERROR)).toEqual(1);
      });
    });
  });

  it('Returns an EXISTING response', () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.updateDep(new Dependency('hot-tech2', '2.2.2'), new BatchRequest()).then(result => {
      expect(result[0]).toEqual(ArdoqComponentCreatedStatus.EXISTING);

      // should now use a cached result
      client.updateDep(new Dependency('hot-tech2', '2.2.2'), new BatchRequest()).then(result => {
        expect(result[0]).toEqual(ArdoqComponentCreatedStatus.EXISTING);
      });
    });
  });

  it('createCodeRepoComponent creates', () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createCodeRepoComponent('dtsse-ardoq-adapter').then(result => {
      expect(result).toEqual('1234');
    });
  });

  it('createVcsHostingComponent exists', () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createCodeRepoComponent('github.com/hmcts').then(result => {
      expect(result).toEqual('5678');
    });
  });

  it('createVcsHostingComponent err', () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.createCodeRepoComponent('github.com/blah').then(result => {
      expect(result).toEqual(null);
    });
  });

  it('updateDep exists but not cached', () => {
    const client = new ArdoqClient(mockedAxios, cache);
    client.updateDep(new Dependency('known-but-not-cached', '1.1.1'), new BatchRequest()).then(result => {
      expect(result[0]).toEqual(ArdoqComponentCreatedStatus.EXISTING);
      expect(result[1]).toEqual('91011');
    });
  });
});
